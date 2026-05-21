"""
Sortie routes — thin layer that validates input, enforces RBAC, and delegates to sortie_service.

All business logic lives in app/services/sortie_service.py.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_roles
from app.db.database import get_db
from app.db.models import Role, User
from app.schemas.sortie import SortieCreate, SortieOut
from app.services import sortie_service

router = APIRouter(prefix="/sorties", tags=["sorties"])


# ── Create ──────────────────────────────────────────────────────────────────

@router.post("", response_model=SortieOut, status_code=status.HTTP_201_CREATED, summary="Create a new sortie")
def create_sortie(
    payload: SortieCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.DISPATCHER)),
):
    """
    Create a new sortie.

    **RBAC:** DISPATCHER only.

    **Business rules enforced:**
    - Aircraft must not be GROUNDED or in MAINTENANCE.
    - Cadet and instructor must exist with correct roles.
    - Sortie number must be unique.
    - scheduled_start < scheduled_end.
    """
    return sortie_service.create_sortie(db, payload.model_dump(), current_user)


# ── List ─────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[SortieOut], summary="List sorties (role-filtered)")
def list_sorties(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List sorties filtered by role:
    - **CADET** → own sorties only
    - **INSTRUCTOR** → assigned sorties only
    - All other roles → all sorties
    """
    return sortie_service.get_sorties_for_user(db, current_user)


# ── Get One ───────────────────────────────────────────────────────────────────

@router.get("/{sortie_id}", response_model=SortieOut, summary="Get sortie detail")
def get_sortie(
    sortie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a single sortie. CADET and INSTRUCTOR visibility is restricted to assigned sorties.
    """
    return sortie_service.get_sortie_for_user(db, sortie_id, current_user)


# ── State Transitions ─────────────────────────────────────────────────────────

@router.patch("/{sortie_id}/release", response_model=SortieOut, summary="Release sortie for flight")
def release_sortie(
    sortie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.DISPATCHER)),
):
    """
    **SCHEDULED → RELEASED**

    **RBAC:** DISPATCHER only.

    Validates aircraft is airworthy (not GROUNDED / MAINTENANCE).
    """
    return sortie_service.release_sortie(db, sortie_id, current_user)


@router.patch("/{sortie_id}/airborne", response_model=SortieOut, summary="Mark sortie as airborne")
def mark_airborne(
    sortie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.DISPATCHER)),
):
    """
    **RELEASED → AIRBORNE**

    **RBAC:** DISPATCHER only.

    Records `actual_start`, calculates `delay_minutes`, sets aircraft → AIRBORNE.
    """
    return sortie_service.mark_airborne(db, sortie_id, current_user)


@router.patch("/{sortie_id}/landed", response_model=SortieOut, summary="Mark sortie as landed")
def mark_landed(
    sortie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.DISPATCHER)),
):
    """
    **AIRBORNE → LANDED**

    **RBAC:** DISPATCHER only.

    Records `actual_end`, sets aircraft → LANDED.
    """
    return sortie_service.mark_landed(db, sortie_id, current_user)


@router.patch("/{sortie_id}/cancel", response_model=SortieOut, summary="Cancel a sortie")
def cancel_sortie(
    sortie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.DISPATCHER)),
):
    """
    **SCHEDULED / RELEASED → CANCELLED**

    **RBAC:** DISPATCHER only.
    """
    return sortie_service.cancel_sortie(db, sortie_id, current_user)


@router.patch("/{sortie_id}/close", response_model=SortieOut, summary="Close a completed sortie")
def close_sortie(
    sortie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.DISPATCHER, Role.CFI)),
):
    """
    **TRAINING_APPROVED → CLOSED**

    **RBAC:** DISPATCHER or CFI.

    Pre-conditions checked:
    1. At least one APPROVED training record for this sortie.
    2. Zero OPEN defects linked to this sortie.
    """
    return sortie_service.close_sortie(db, sortie_id, current_user)
