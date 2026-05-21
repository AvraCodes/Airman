"""
Training progress routes — thin, delegates entirely to training_service.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_roles
from app.db.database import get_db
from app.db.models import Role, User
from app.schemas.training_progress import (
    RejectTrainingRequest,
    TrainingProgressCreate,
    TrainingProgressOut,
    TrainingProgressUpdate,
)
from app.services import training_service

router = APIRouter(prefix="/training-progress", tags=["training-progress"])


@router.post("", response_model=TrainingProgressOut, status_code=status.HTTP_201_CREATED,
             summary="Create a training record for a landed sortie")
def create_training_progress(
    payload: TrainingProgressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.INSTRUCTOR, Role.CFI)),
):
    """
    Create a DRAFT training progress record.

    **RBAC:** INSTRUCTOR (assigned to sortie) or CFI.

    **Business rules:**
    - Sortie must be in LANDED status.
    - Only one record per sortie (409 if duplicate).
    - Scores must be 1–5.
    """
    return training_service.create_training_record(db, payload.model_dump(), current_user)


@router.get("/{sortie_id}", response_model=list[TrainingProgressOut],
            summary="Get training records for a sortie")
def get_training_progress(
    sortie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch training records for a sortie.

    **Role-filtered:**
    - CADET → only APPROVED records for own sortie.
    - INSTRUCTOR → all records for assigned sortie.
    - CFI / ADMIN / DISPATCHER → everything.
    """
    return training_service.get_training_for_sortie(db, sortie_id, current_user)


@router.patch("/{progress_id}/submit", response_model=TrainingProgressOut,
              summary="Submit a DRAFT record for CFI review")
def submit_training_progress(
    progress_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.INSTRUCTOR)),
):
    """
    **DRAFT / REJECTED → SUBMITTED**

    **RBAC:** INSTRUCTOR (assigned) only.

    Remarks must be non-empty. All scores validated to 1–5.
    Sortie automatically moves to TRAINING_SUBMITTED.
    """
    return training_service.submit_training_record(db, progress_id, current_user)


@router.patch("/{progress_id}/approve", response_model=TrainingProgressOut,
              summary="Approve a submitted training record")
def approve_training_progress(
    progress_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.CFI)),
):
    """
    **SUBMITTED → APPROVED**

    **RBAC:** CFI only.

    Sortie automatically moves to TRAINING_APPROVED.
    """
    return training_service.approve_training_record(db, progress_id, current_user)


@router.patch("/{progress_id}/reject", response_model=TrainingProgressOut,
              summary="Reject a submitted training record with remarks")
def reject_training_progress(
    progress_id: int,
    payload: RejectTrainingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.CFI)),
):
    """
    **SUBMITTED → REJECTED**

    **RBAC:** CFI only.

    After rejection, record returns to REJECTED status (allowing re-submission by instructor).
    Rejection remarks are appended to the record's remarks field.
    Minimum 10 characters required for rejection remarks.
    """
    return training_service.reject_training_record(db, progress_id, payload.remarks, current_user)


@router.patch("/{progress_id}", response_model=TrainingProgressOut,
              summary="Update a DRAFT training record")
def update_training_progress(
    progress_id: int,
    payload: TrainingProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.INSTRUCTOR)),
):
    """
    Patch scores or remarks on a DRAFT record before submission.

    **RBAC:** INSTRUCTOR (assigned) only.
    """
    from fastapi import HTTPException
    from app.db.models import TrainingProgress, TrainingStatus

    progress = db.query(TrainingProgress).filter(TrainingProgress.id == progress_id).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Training record not found")
    if progress.status not in {TrainingStatus.DRAFT, TrainingStatus.REJECTED}:
        raise HTTPException(status_code=400, detail="Only DRAFT or REJECTED records can be edited")

    from app.db.models import Sortie
    sortie = db.query(Sortie).filter(Sortie.id == progress.sortie_id).first()
    if current_user.role == Role.INSTRUCTOR and current_user.id != sortie.instructor_id:
        raise HTTPException(status_code=403, detail="Only the assigned instructor can edit this record")

    updates = payload.model_dump(exclude_none=True)
    for field, value in updates.items():
        setattr(progress, field, value)
    db.commit()
    db.refresh(progress)
    return progress
