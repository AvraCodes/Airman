"""
Aircraft readiness service — handles status transitions and defect tracking.

Aircraft status machine:
    READY ↔ SCHEDULED ↔ AIRBORNE ↔ LANDED  (managed by sortie service)
    Any → GROUNDED  (on defect report)
    GROUNDED → READY  (only after ALL open defects are resolved)
    Any → MAINTENANCE  (manual override by MAINTENANCE_OFFICER)
    MAINTENANCE → READY  (manual release by MAINTENANCE_OFFICER)
"""
from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import Aircraft, AircraftStatus, Defect, DefectStatus, Role, User
from app.services.audit_service import create_audit_log


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _get_aircraft(db: Session, aircraft_id: int) -> Aircraft:
    aircraft = db.query(Aircraft).filter(Aircraft.id == aircraft_id).first()
    if not aircraft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aircraft not found")
    return aircraft


def _open_defect_count(db: Session, aircraft_id: int) -> int:
    return (
        db.query(Defect)
        .filter(Defect.aircraft_id == aircraft_id, Defect.status == DefectStatus.OPEN)
        .count()
    )


# ─────────────────────────────────────────────────────────────────────────────
# Aircraft actions
# ─────────────────────────────────────────────────────────────────────────────

def ground_aircraft(db: Session, aircraft_id: int, actor: User) -> Aircraft:
    """
    Force an aircraft to GROUNDED status.

    Rules:
    - Only MAINTENANCE_OFFICER or ADMIN can manually ground an aircraft.
    - AIRBORNE aircraft cannot be manually grounded (must land first).
    """
    aircraft = _get_aircraft(db, aircraft_id)

    if aircraft.status == AircraftStatus.AIRBORNE:
        raise HTTPException(
            status_code=400,
            detail=f"Aircraft {aircraft.registration} is currently AIRBORNE — cannot be grounded mid-flight",
        )
    if aircraft.status == AircraftStatus.GROUNDED:
        raise HTTPException(status_code=400, detail=f"Aircraft {aircraft.registration} is already GROUNDED")

    old = aircraft.status.value
    aircraft.status = AircraftStatus.GROUNDED
    db.commit()
    create_audit_log(db, actor.id, "AIRCRAFT_GROUNDED", "aircraft", aircraft.id, old, "GROUNDED")
    db.refresh(aircraft)
    return aircraft


def release_aircraft_to_ready(db: Session, aircraft_id: int, actor: User) -> Aircraft:
    """
    Move aircraft from GROUNDED / MAINTENANCE → READY.

    Rules:
    - Only MAINTENANCE_OFFICER or ADMIN can release an aircraft.
    - Aircraft must have ZERO open defects to become READY.
    - Aircraft must currently be GROUNDED or MAINTENANCE.
    """
    aircraft = _get_aircraft(db, aircraft_id)

    if aircraft.status not in {AircraftStatus.GROUNDED, AircraftStatus.MAINTENANCE, AircraftStatus.LANDED}:
        raise HTTPException(
            status_code=400,
            detail=f"Aircraft {aircraft.registration} is {aircraft.status.value} — only GROUNDED, MAINTENANCE, or LANDED aircraft can be released to READY",
        )

    open_count = _open_defect_count(db, aircraft_id)
    if open_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Aircraft {aircraft.registration} has {open_count} unresolved defect(s). Resolve all defects before releasing.",
        )

    old = aircraft.status.value
    aircraft.status = AircraftStatus.READY
    db.commit()
    create_audit_log(db, actor.id, "AIRCRAFT_RELEASED_READY", "aircraft", aircraft.id, old, "READY")
    db.refresh(aircraft)
    return aircraft


def send_to_maintenance(db: Session, aircraft_id: int, actor: User) -> Aircraft:
    """
    Move aircraft to MAINTENANCE status (scheduled deep maintenance).
    Separate from GROUNDED (which is defect-triggered).
    """
    aircraft = _get_aircraft(db, aircraft_id)

    if aircraft.status == AircraftStatus.AIRBORNE:
        raise HTTPException(status_code=400, detail="Cannot send airborne aircraft to maintenance")
    if aircraft.status == AircraftStatus.MAINTENANCE:
        raise HTTPException(status_code=400, detail="Aircraft is already in MAINTENANCE")

    old = aircraft.status.value
    aircraft.status = AircraftStatus.MAINTENANCE
    db.commit()
    create_audit_log(db, actor.id, "AIRCRAFT_TO_MAINTENANCE", "aircraft", aircraft.id, old, "MAINTENANCE")
    db.refresh(aircraft)
    return aircraft


def get_aircraft_readiness_summary(db: Session) -> dict:
    """Return counts by status for dashboard / readiness board."""
    all_aircraft = db.query(Aircraft).all()
    summary: dict[str, int] = {s.value: 0 for s in AircraftStatus}
    for a in all_aircraft:
        summary[a.status.value] += 1
    return {
        "total": len(all_aircraft),
        "by_status": summary,
        "ready_count": summary.get("READY", 0),
        "grounded_count": summary.get("GROUNDED", 0) + summary.get("MAINTENANCE", 0),
    }
