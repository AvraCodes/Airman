"""
Training progress service — business logic for the instructor→CFI approval workflow.

Workflow:
  DRAFT → SUBMITTED (by assigned instructor, requires non-empty remarks)
  SUBMITTED → APPROVED (by CFI) → triggers sortie TRAINING_APPROVED
  SUBMITTED → REJECTED (by CFI, requires rejection remarks) → back to DRAFT for re-submission
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import (
    Role, Sortie, SortieStatus,
    TrainingProgress, TrainingStatus, User,
)
from app.services.audit_service import create_audit_log


# ─────────────────────────────────────────────────────────────────────────────
# Score validation constants
# ─────────────────────────────────────────────────────────────────────────────

SCORE_MIN = 1
SCORE_MAX = 5

SCORE_FIELDS = ("maneuver_score", "communication_score", "situational_awareness_score")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _validate_scores(maneuver: int, communication: int, situational: int) -> None:
    """Raise 422 if any score is outside 1–5."""
    for name, val in [
        ("maneuver_score", maneuver),
        ("communication_score", communication),
        ("situational_awareness_score", situational),
    ]:
        if not (SCORE_MIN <= val <= SCORE_MAX):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{name} must be between {SCORE_MIN} and {SCORE_MAX}, got {val}",
            )


def _get_progress(db: Session, progress_id: int) -> TrainingProgress:
    progress = db.query(TrainingProgress).filter(TrainingProgress.id == progress_id).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Training record not found")
    return progress


def _get_sortie(db: Session, sortie_id: int) -> Sortie:
    sortie = db.query(Sortie).filter(Sortie.id == sortie_id).first()
    if not sortie:
        raise HTTPException(status_code=404, detail="Sortie not found")
    return sortie


# ─────────────────────────────────────────────────────────────────────────────
# Create
# ─────────────────────────────────────────────────────────────────────────────

def create_training_record(db: Session, payload: dict, actor: User) -> TrainingProgress:
    """
    Create a DRAFT training record.

    Rules:
    - Only the INSTRUCTOR assigned to the sortie may create (or ADMIN).
    - Scores validated to be in range 1–5 (even for a DRAFT).
    - Sortie must be in LANDED status (or later) — cannot submit training for airborne flight.
    - Only one training record per sortie (update the existing one instead).
    """
    sortie = _get_sortie(db, payload["sortie_id"])

    if actor.role not in {Role.INSTRUCTOR, Role.CFI, Role.ADMIN}:
        raise HTTPException(status_code=403, detail="Only an instructor can create a training record")

    if actor.role == Role.INSTRUCTOR and actor.id != sortie.instructor_id:
        raise HTTPException(status_code=403, detail="Only the assigned instructor can create a training record")

    if sortie.status not in {
        SortieStatus.LANDED, SortieStatus.TRAINING_SUBMITTED,
        SortieStatus.TRAINING_APPROVED, SortieStatus.RECOVERY_REQUIRED,
    }:
        raise HTTPException(
            status_code=400,
            detail=f"Training records can only be created for LANDED sorties (current: {sortie.status.value})",
        )

    existing = (
        db.query(TrainingProgress)
        .filter(TrainingProgress.sortie_id == sortie.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"A training record already exists for this sortie (id={existing.id}). Update that record instead.",
        )

    _validate_scores(payload["maneuver_score"], payload["communication_score"], payload["situational_awareness_score"])

    progress = TrainingProgress(
        sortie_id=payload["sortie_id"],
        cadet_id=payload.get("cadet_id", sortie.cadet_id),
        instructor_id=payload.get("instructor_id", sortie.instructor_id),
        lesson_type=payload.get("lesson_type", sortie.lesson_type),
        maneuver_score=payload["maneuver_score"],
        communication_score=payload["communication_score"],
        situational_awareness_score=payload["situational_awareness_score"],
        remarks=payload.get("remarks", ""),
        status=TrainingStatus.DRAFT,
    )
    db.add(progress)
    db.commit()
    db.refresh(progress)
    create_audit_log(db, actor.id, "TRAINING_CREATED", "training_progress", progress.id, None, "DRAFT")
    return progress


# ─────────────────────────────────────────────────────────────────────────────
# Query
# ─────────────────────────────────────────────────────────────────────────────

def get_training_for_sortie(db: Session, sortie_id: int, actor: User) -> list[TrainingProgress]:
    """
    Fetch all training records for a sortie, role-filtered:
    - CADET: only sees APPROVED records for their own sorties.
    - INSTRUCTOR: sees all records for their assigned sorties.
    - CFI / ADMIN / DISPATCHER: sees everything.
    """
    sortie = _get_sortie(db, sortie_id)
    q = db.query(TrainingProgress).filter(TrainingProgress.sortie_id == sortie.id)

    if actor.role == Role.CADET:
        if sortie.cadet_id != actor.id:
            raise HTTPException(status_code=403, detail="Cadet can only view their own training records")
        q = q.filter(TrainingProgress.status == TrainingStatus.APPROVED)
    elif actor.role == Role.INSTRUCTOR:
        if sortie.instructor_id != actor.id:
            raise HTTPException(status_code=403, detail="Instructor can only view assigned sortie records")

    return q.all()


# ─────────────────────────────────────────────────────────────────────────────
# Submit
# ─────────────────────────────────────────────────────────────────────────────

def submit_training_record(db: Session, progress_id: int, actor: User) -> TrainingProgress:
    """
    DRAFT → SUBMITTED.

    Rules:
    - Only the INSTRUCTOR assigned to the sortie (or ADMIN) may submit.
    - Remarks must be non-empty.
    - All scores must be in 1–5 range.
    - Record must be in DRAFT (or REJECTED — allow re-submission after CFI reject).
    """
    progress = _get_progress(db, progress_id)

    if actor.role not in {Role.INSTRUCTOR, Role.ADMIN}:
        raise HTTPException(status_code=403, detail="Only an instructor can submit a training record")

    sortie = _get_sortie(db, progress.sortie_id)
    if actor.role == Role.INSTRUCTOR and actor.id != sortie.instructor_id:
        raise HTTPException(status_code=403, detail="Only the assigned instructor can submit this record")

    if progress.status not in {TrainingStatus.DRAFT, TrainingStatus.REJECTED}:
        raise HTTPException(
            status_code=400,
            detail=f"Only DRAFT or REJECTED records can be submitted (current: {progress.status.value})",
        )

    remarks = progress.remarks.strip() if progress.remarks else ""
    if not remarks:
        raise HTTPException(status_code=400, detail="Remarks are required before submission")

    _validate_scores(progress.maneuver_score, progress.communication_score, progress.situational_awareness_score)

    old = progress.status.value
    progress.status = TrainingStatus.SUBMITTED
    progress.submitted_at = _utcnow()

    # Update sortie status
    sortie.status = SortieStatus.TRAINING_SUBMITTED
    db.commit()

    create_audit_log(db, actor.id, "TRAINING_SUBMITTED", "training_progress", progress.id, old, "SUBMITTED")
    create_audit_log(db, actor.id, "SORTIE_TRAINING_SUBMITTED", "sortie", sortie.id, SortieStatus.LANDED.value, SortieStatus.TRAINING_SUBMITTED.value)

    db.refresh(progress)
    return progress


# ─────────────────────────────────────────────────────────────────────────────
# Approve
# ─────────────────────────────────────────────────────────────────────────────

def approve_training_record(db: Session, progress_id: int, actor: User) -> TrainingProgress:
    """
    SUBMITTED → APPROVED.

    Rules:
    - Only CFI (or ADMIN) may approve.
    - Record must be in SUBMITTED status.
    - Sortie automatically moves to TRAINING_APPROVED.
    """
    progress = _get_progress(db, progress_id)

    if actor.role not in {Role.CFI, Role.ADMIN}:
        raise HTTPException(status_code=403, detail="Only a CFI can approve training records")

    if progress.status != TrainingStatus.SUBMITTED:
        raise HTTPException(
            status_code=400,
            detail=f"Only SUBMITTED records can be approved (current: {progress.status.value})",
        )

    old = progress.status.value
    progress.status = TrainingStatus.APPROVED
    progress.approved_by = actor.id
    progress.approved_at = _utcnow()

    sortie = _get_sortie(db, progress.sortie_id)
    sortie.status = SortieStatus.TRAINING_APPROVED
    db.commit()

    create_audit_log(db, actor.id, "TRAINING_APPROVED", "training_progress", progress.id, old, "APPROVED")
    create_audit_log(db, actor.id, "SORTIE_TRAINING_APPROVED", "sortie", sortie.id, SortieStatus.TRAINING_SUBMITTED.value, SortieStatus.TRAINING_APPROVED.value)

    db.refresh(progress)
    return progress


# ─────────────────────────────────────────────────────────────────────────────
# Reject
# ─────────────────────────────────────────────────────────────────────────────

def reject_training_record(db: Session, progress_id: int, rejection_remarks: str, actor: User) -> TrainingProgress:
    """
    SUBMITTED → REJECTED (set back to DRAFT for re-submission).

    Rules:
    - Only CFI (or ADMIN) may reject.
    - Rejection remarks are mandatory.
    - After rejection, record returns to DRAFT so instructor can amend and re-submit.
    """
    progress = _get_progress(db, progress_id)

    if actor.role not in {Role.CFI, Role.ADMIN}:
        raise HTTPException(status_code=403, detail="Only a CFI can reject training records")

    if progress.status != TrainingStatus.SUBMITTED:
        raise HTTPException(
            status_code=400,
            detail=f"Only SUBMITTED records can be rejected (current: {progress.status.value})",
        )

    if not rejection_remarks.strip():
        raise HTTPException(status_code=400, detail="Rejection remarks are required")

    old = progress.status.value
    # Append CFI rejection note so history is preserved in the remarks field
    progress.remarks = f"{progress.remarks}\n[CFI REJECTED by {actor.full_name}] {rejection_remarks.strip()}"
    # Reset to DRAFT so instructor can amend and re-submit
    progress.status = TrainingStatus.REJECTED
    db.commit()

    create_audit_log(db, actor.id, "TRAINING_REJECTED", "training_progress", progress.id, old, "REJECTED")

    db.refresh(progress)
    return progress
