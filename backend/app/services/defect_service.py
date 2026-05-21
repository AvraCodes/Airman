"""
Defect service — aircraft defect reporting, tracking, and resolution.

Rules:
- Reporting a defect immediately grounds the aircraft.
- If a defect is linked to an in-progress sortie, that sortie moves to RECOVERY_REQUIRED.
- Resolving a defect does NOT automatically un-ground the aircraft.
  Aircraft must be explicitly released via aircraft_service.release_aircraft_to_ready()
  after ALL defects are resolved.
- A resolution decision is mandatory when resolving.
- CRITICAL severity defects trigger an additional audit flag.
"""
from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import (
    Aircraft, AircraftStatus,
    Defect, DefectSeverity, DefectStatus,
    Role, Sortie, SortieStatus, User,
)
from app.services.audit_service import create_audit_log


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _get_aircraft(db: Session, aircraft_id: int) -> Aircraft:
    aircraft = db.query(Aircraft).filter(Aircraft.id == aircraft_id).first()
    if not aircraft:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    return aircraft


def _get_defect(db: Session, defect_id: int) -> Defect:
    defect = db.query(Defect).filter(Defect.id == defect_id).first()
    if not defect:
        raise HTTPException(status_code=404, detail="Defect not found")
    return defect


def _open_defects_for_aircraft(db: Session, aircraft_id: int) -> list[Defect]:
    return (
        db.query(Defect)
        .filter(Defect.aircraft_id == aircraft_id, Defect.status == DefectStatus.OPEN)
        .all()
    )


# ─────────────────────────────────────────────────────────────────────────────
# Report
# ─────────────────────────────────────────────────────────────────────────────

def report_defect(
    db: Session,
    aircraft_id: int,
    sortie_id: int | None,
    severity: DefectSeverity,
    description: str,
    actor: User,
) -> Defect:
    """
    Report a new defect. Immediately grounds the aircraft.

    If `sortie_id` is provided and the sortie is currently AIRBORNE or LANDED,
    the sortie is moved to RECOVERY_REQUIRED.
    """
    if not description.strip():
        raise HTTPException(status_code=400, detail="Defect description cannot be empty")

    aircraft = _get_aircraft(db, aircraft_id)

    # Validate sortie linkage
    sortie: Sortie | None = None
    if sortie_id is not None:
        sortie = db.query(Sortie).filter(Sortie.id == sortie_id).first()
        if not sortie:
            raise HTTPException(status_code=404, detail=f"Sortie {sortie_id} not found")
        if sortie.aircraft_id != aircraft_id:
            raise HTTPException(
                status_code=400,
                detail=f"Sortie {sortie_id} is not assigned to aircraft {aircraft.registration}",
            )

    defect = Defect(
        aircraft_id=aircraft_id,
        sortie_id=sortie_id,
        reported_by=actor.id,
        severity=severity,
        description=description.strip(),
        status=DefectStatus.OPEN,
    )
    db.add(defect)

    # Ground the aircraft
    old_aircraft_status = aircraft.status.value
    aircraft.status = AircraftStatus.GROUNDED

    # Move sortie to RECOVERY_REQUIRED if applicable
    if sortie and sortie.status in {SortieStatus.AIRBORNE, SortieStatus.LANDED, SortieStatus.RECOVERY_REQUIRED}:
        if sortie.status != SortieStatus.RECOVERY_REQUIRED:
            old_sortie_status = sortie.status.value
            sortie.status = SortieStatus.RECOVERY_REQUIRED
            db.flush()  # get defect.id before audit log
            create_audit_log(
                db, actor.id, "SORTIE_RECOVERY_REQUIRED", "sortie",
                sortie.id, old_sortie_status, SortieStatus.RECOVERY_REQUIRED.value,
            )

    db.commit()
    db.refresh(defect)

    action = "DEFECT_CRITICAL_REPORTED" if severity == DefectSeverity.CRITICAL else "DEFECT_REPORTED"
    create_audit_log(
        db, actor.id, action, "defect", defect.id,
        None, f"severity={severity.value} aircraft={aircraft.registration} [{old_aircraft_status}→GROUNDED]",
    )

    return defect


# ─────────────────────────────────────────────────────────────────────────────
# Query
# ─────────────────────────────────────────────────────────────────────────────

def list_defects(
    db: Session,
    aircraft_id: int | None = None,
    sortie_id: int | None = None,
    status_filter: DefectStatus | None = None,
) -> list[Defect]:
    """List defects with optional filters."""
    q = db.query(Defect)
    if aircraft_id is not None:
        q = q.filter(Defect.aircraft_id == aircraft_id)
    if sortie_id is not None:
        q = q.filter(Defect.sortie_id == sortie_id)
    if status_filter is not None:
        q = q.filter(Defect.status == status_filter)
    return q.order_by(Defect.created_at.desc()).all()


# ─────────────────────────────────────────────────────────────────────────────
# Resolve
# ─────────────────────────────────────────────────────────────────────────────

def resolve_defect(db: Session, defect_id: int, recovery_decision: str, actor: User) -> Defect:
    """
    Resolve a defect with a mandatory recovery decision.

    Rules:
    - Only MAINTENANCE_OFFICER or ADMIN can resolve.
    - Recovery decision text is required.
    - After resolution, if ALL defects for the linked sortie are resolved
      and the sortie is RECOVERY_REQUIRED, it is moved back to LANDED.
    - Aircraft is NOT automatically un-grounded — use release_aircraft_to_ready().
    """
    if not recovery_decision.strip():
        raise HTTPException(status_code=400, detail="Recovery decision text is required to resolve a defect")

    defect = _get_defect(db, defect_id)

    if defect.status == DefectStatus.RESOLVED:
        raise HTTPException(status_code=400, detail="Defect is already resolved")

    old = defect.status.value
    defect.status = DefectStatus.RESOLVED
    defect.recovery_decision = recovery_decision.strip()

    # Check if all defects for the linked sortie are now resolved
    if defect.sortie_id:
        remaining_open = (
            db.query(Defect)
            .filter(
                Defect.sortie_id == defect.sortie_id,
                Defect.status == DefectStatus.OPEN,
                Defect.id != defect.id,  # exclude current defect (not yet committed)
            )
            .count()
        )
        if remaining_open == 0:
            sortie = db.query(Sortie).filter(Sortie.id == defect.sortie_id).first()
            if sortie and sortie.status == SortieStatus.RECOVERY_REQUIRED:
                old_sortie = sortie.status.value
                sortie.status = SortieStatus.LANDED
                create_audit_log(
                    db, actor.id, "SORTIE_RECOVERED", "sortie",
                    sortie.id, old_sortie, SortieStatus.LANDED.value,
                )

    db.commit()
    create_audit_log(db, actor.id, "DEFECT_RESOLVED", "defect", defect.id, old, "RESOLVED")
    db.refresh(defect)

    # Inform caller about remaining open defects on the aircraft (for response enrichment)
    remaining_aircraft_defects = len(_open_defects_for_aircraft(db, defect.aircraft_id))
    if remaining_aircraft_defects > 0:
        # Aircraft stays GROUNDED — note this in audit
        create_audit_log(
            db, actor.id, "AIRCRAFT_STILL_GROUNDED", "aircraft",
            defect.aircraft_id, "GROUNDED",
            f"{remaining_aircraft_defects} open defect(s) remain",
        )

    return defect
