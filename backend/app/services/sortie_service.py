"""
Sortie workflow service — all business logic lives here, routes are thin.

State machine:
    SCHEDULED → RELEASED → AIRBORNE → LANDED
    LANDED → TRAINING_SUBMITTED → TRAINING_APPROVED → CLOSED
    SCHEDULED / RELEASED → CANCELLED
    AIRBORNE / LANDED  → RECOVERY_REQUIRED  (via defect report)
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import (
    Aircraft, AircraftStatus,
    Defect, DefectStatus,
    Role, Sortie, SortieStatus,
    TrainingProgress, TrainingStatus,
    User,
)
from app.services.audit_service import create_audit_log

if TYPE_CHECKING:
    pass

# ─────────────────────────────────────────────────────────────────────────────
# Valid state transition graph
# ─────────────────────────────────────────────────────────────────────────────

VALID_TRANSITIONS: dict[SortieStatus, set[SortieStatus]] = {
    SortieStatus.SCHEDULED:          {SortieStatus.RELEASED, SortieStatus.CANCELLED},
    SortieStatus.RELEASED:           {SortieStatus.AIRBORNE, SortieStatus.CANCELLED},
    SortieStatus.AIRBORNE:           {SortieStatus.LANDED, SortieStatus.RECOVERY_REQUIRED},
    SortieStatus.LANDED:             {SortieStatus.TRAINING_SUBMITTED, SortieStatus.RECOVERY_REQUIRED},
    SortieStatus.RECOVERY_REQUIRED:  {SortieStatus.LANDED},            # after all defects resolved
    SortieStatus.TRAINING_SUBMITTED: {SortieStatus.TRAINING_APPROVED},
    SortieStatus.TRAINING_APPROVED:  {SortieStatus.CLOSED},
}

# Human-readable action name per transition for audit log
TRANSITION_ACTION: dict[tuple[SortieStatus, SortieStatus], str] = {
    (SortieStatus.SCHEDULED, SortieStatus.RELEASED):               "SORTIE_RELEASED",
    (SortieStatus.SCHEDULED, SortieStatus.CANCELLED):              "SORTIE_CANCELLED",
    (SortieStatus.RELEASED,  SortieStatus.AIRBORNE):               "SORTIE_AIRBORNE",
    (SortieStatus.RELEASED,  SortieStatus.CANCELLED):              "SORTIE_CANCELLED",
    (SortieStatus.AIRBORNE,  SortieStatus.LANDED):                 "SORTIE_LANDED",
    (SortieStatus.AIRBORNE,  SortieStatus.RECOVERY_REQUIRED):      "SORTIE_RECOVERY_REQUIRED",
    (SortieStatus.LANDED,    SortieStatus.TRAINING_SUBMITTED):     "SORTIE_TRAINING_SUBMITTED",
    (SortieStatus.LANDED,    SortieStatus.RECOVERY_REQUIRED):      "SORTIE_RECOVERY_REQUIRED",
    (SortieStatus.RECOVERY_REQUIRED, SortieStatus.LANDED):         "SORTIE_RECOVERED",
    (SortieStatus.TRAINING_SUBMITTED, SortieStatus.TRAINING_APPROVED): "SORTIE_TRAINING_APPROVED",
    (SortieStatus.TRAINING_APPROVED, SortieStatus.CLOSED):         "SORTIE_CLOSED",
}


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _get_sortie(db: Session, sortie_id: int) -> Sortie:
    sortie = db.query(Sortie).filter(Sortie.id == sortie_id).first()
    if not sortie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sortie not found")
    return sortie


def _get_aircraft(db: Session, aircraft_id: int) -> Aircraft:
    aircraft = db.query(Aircraft).filter(Aircraft.id == aircraft_id).first()
    if not aircraft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aircraft not found")
    return aircraft


def _assert_valid_transition(sortie: Sortie, target: SortieStatus) -> None:
    """Raise 400 if the requested status transition is not permitted."""
    allowed = VALID_TRANSITIONS.get(sortie.status, set())
    if target not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid transition: {sortie.status.value} → {target.value}. "
                f"Allowed next states: {[s.value for s in allowed] or 'none'}"
            ),
        )


def _compute_delay(sortie: Sortie) -> int:
    """
    Compute delay in minutes = actual_start - scheduled_start.
    Returns 0 if actual_start is not yet set or if the flight was early.
    """
    if sortie.actual_start is None:
        return 0
    diff = (sortie.actual_start - sortie.scheduled_start).total_seconds() / 60
    return max(0, int(diff))


def _apply_transition(
    db: Session,
    sortie: Sortie,
    new_status: SortieStatus,
    actor_id: int,
    *,
    extra_notes: str | None = None,
) -> Sortie:
    """
    Apply a status transition, write audit log, and return the refreshed sortie.
    Does NOT call _assert_valid_transition — callers are expected to do that first.
    """
    old_status = sortie.status.value
    sortie.status = new_status
    action = TRANSITION_ACTION.get((SortieStatus(old_status), new_status), "SORTIE_TRANSITION")
    note = f"{old_status} → {new_status.value}" + (f" | {extra_notes}" if extra_notes else "")
    create_audit_log(db, actor_id, action, "sortie", sortie.id, old_status, note)
    db.commit()
    db.refresh(sortie)
    return sortie


# ─────────────────────────────────────────────────────────────────────────────
# Sortie CRUD
# ─────────────────────────────────────────────────────────────────────────────

def create_sortie(db: Session, payload: dict, actor: User) -> Sortie:
    """
    Create a new sortie.

    Business rules:
    - Aircraft must exist and must NOT be GROUNDED.
    - Cadet and instructor must both exist.
    - Sortie number must be unique.
    """
    existing = db.query(Sortie).filter(Sortie.sortie_number == payload["sortie_number"]).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Sortie number already exists")

    aircraft = _get_aircraft(db, payload["aircraft_id"])
    if aircraft.status == AircraftStatus.GROUNDED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Aircraft {aircraft.registration} is GROUNDED and cannot be assigned to a new sortie",
        )
    if aircraft.status == AircraftStatus.MAINTENANCE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Aircraft {aircraft.registration} is in MAINTENANCE and cannot be assigned",
        )

    cadet = db.query(User).filter(User.id == payload["cadet_id"], User.role == Role.CADET).first()
    if not cadet:
        raise HTTPException(status_code=400, detail="Cadet not found or user is not a CADET")

    instructor = db.query(User).filter(
        User.id == payload["instructor_id"],
        User.role.in_([Role.INSTRUCTOR, Role.CFI, Role.ADMIN]),
    ).first()
    if not instructor:
        raise HTTPException(status_code=400, detail="Instructor not found or user is not an INSTRUCTOR/CFI")

    if payload["scheduled_start"] >= payload["scheduled_end"]:
        raise HTTPException(status_code=400, detail="scheduled_start must be before scheduled_end")

    sortie = Sortie(**payload)
    db.add(sortie)
    db.commit()
    db.refresh(sortie)
    create_audit_log(db, actor.id, "SORTIE_CREATED", "sortie", sortie.id, None, sortie.status.value)
    return sortie


def get_sorties_for_user(db: Session, actor: User) -> list[Sortie]:
    """Role-filtered sortie list."""
    q = db.query(Sortie)
    if actor.role == Role.CADET:
        q = q.filter(Sortie.cadet_id == actor.id)
    elif actor.role == Role.INSTRUCTOR:
        q = q.filter(Sortie.instructor_id == actor.id)
    # DISPATCHER, CFI, ADMIN, MAINTENANCE_OFFICER see all
    return q.order_by(Sortie.scheduled_start.desc()).all()


def get_sortie_for_user(db: Session, sortie_id: int, actor: User) -> Sortie:
    """Get a single sortie with RBAC visibility check."""
    sortie = _get_sortie(db, sortie_id)
    if actor.role == Role.CADET and sortie.cadet_id != actor.id:
        raise HTTPException(status_code=403, detail="Cadet can only view their own sortie")
    if actor.role == Role.INSTRUCTOR and sortie.instructor_id != actor.id:
        raise HTTPException(status_code=403, detail="Instructor can only view assigned sorties")
    return sortie


# ─────────────────────────────────────────────────────────────────────────────
# State transitions
# ─────────────────────────────────────────────────────────────────────────────

def release_sortie(db: Session, sortie_id: int, actor: User) -> Sortie:
    """SCHEDULED → RELEASED. Validates aircraft is airworthy."""
    sortie = _get_sortie(db, sortie_id)
    _assert_valid_transition(sortie, SortieStatus.RELEASED)

    aircraft = sortie.aircraft
    if aircraft.status == AircraftStatus.GROUNDED:
        raise HTTPException(
            status_code=400,
            detail=f"Aircraft {aircraft.registration} is GROUNDED — resolve all defects before releasing",
        )
    if aircraft.status == AircraftStatus.MAINTENANCE:
        raise HTTPException(
            status_code=400,
            detail=f"Aircraft {aircraft.registration} is in MAINTENANCE and cannot be released",
        )

    return _apply_transition(db, sortie, SortieStatus.RELEASED, actor.id)


def mark_airborne(db: Session, sortie_id: int, actor: User) -> Sortie:
    """RELEASED → AIRBORNE. Records actual_start, updates aircraft status."""
    sortie = _get_sortie(db, sortie_id)
    _assert_valid_transition(sortie, SortieStatus.AIRBORNE)

    now = _utcnow()
    sortie.actual_start = now
    sortie.delay_minutes = _compute_delay(sortie)
    sortie.aircraft.status = AircraftStatus.AIRBORNE

    notes = f"delay={sortie.delay_minutes}min" if sortie.delay_minutes else None
    return _apply_transition(db, sortie, SortieStatus.AIRBORNE, actor.id, extra_notes=notes)


def mark_landed(db: Session, sortie_id: int, actor: User) -> Sortie:
    """AIRBORNE → LANDED. Records actual_end, updates aircraft status."""
    sortie = _get_sortie(db, sortie_id)
    _assert_valid_transition(sortie, SortieStatus.LANDED)

    now = _utcnow()
    sortie.actual_end = now
    sortie.aircraft.status = AircraftStatus.LANDED

    flight_minutes = 0
    if sortie.actual_start:
        flight_minutes = int((now - sortie.actual_start).total_seconds() / 60)

    return _apply_transition(db, sortie, SortieStatus.LANDED, actor.id, extra_notes=f"flight_time={flight_minutes}min")


def cancel_sortie(db: Session, sortie_id: int, actor: User) -> Sortie:
    """SCHEDULED / RELEASED → CANCELLED."""
    sortie = _get_sortie(db, sortie_id)
    _assert_valid_transition(sortie, SortieStatus.CANCELLED)
    return _apply_transition(db, sortie, SortieStatus.CANCELLED, actor.id)


def close_sortie(db: Session, sortie_id: int, actor: User) -> Sortie:
    """
    TRAINING_APPROVED → CLOSED.

    Pre-conditions:
    1. At least one APPROVED training record for this sortie.
    2. Zero OPEN defects linked to this sortie.
    """
    sortie = _get_sortie(db, sortie_id)
    _assert_valid_transition(sortie, SortieStatus.CLOSED)

    approved_training = (
        db.query(TrainingProgress)
        .filter(
            TrainingProgress.sortie_id == sortie.id,
            TrainingProgress.status == TrainingStatus.APPROVED,
        )
        .first()
    )
    if not approved_training:
        raise HTTPException(
            status_code=400,
            detail="Cannot close: no approved training record exists for this sortie",
        )

    open_defects = (
        db.query(Defect)
        .filter(Defect.sortie_id == sortie.id, Defect.status == DefectStatus.OPEN)
        .count()
    )
    if open_defects > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot close: {open_defects} unresolved defect(s) still open for this sortie",
        )

    # Release aircraft back to READY (unless it's been grounded separately)
    if sortie.aircraft.status not in {AircraftStatus.GROUNDED, AircraftStatus.MAINTENANCE}:
        sortie.aircraft.status = AircraftStatus.READY

    return _apply_transition(db, sortie, SortieStatus.CLOSED, actor.id)
