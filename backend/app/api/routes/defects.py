"""
Defect management routes — delegates to defect_service.

Endpoints:
  POST   /defects              — report a new defect (grounds aircraft)
  GET    /defects              — list defects (filterable)
  GET    /defects/{id}         — get single defect
  PATCH  /defects/{id}/resolve — resolve with mandatory recovery decision
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_roles
from app.db.database import get_db
from app.db.models import DefectSeverity, DefectStatus, Role, User
from app.schemas.aircraft import DefectCreate, DefectOut, ResolveDefectRequest
from app.services import defect_service

router = APIRouter(prefix="/defects", tags=["defects"])


@router.post("", response_model=DefectOut, status_code=status.HTTP_201_CREATED,
             summary="Report a defect — immediately grounds the aircraft")
def create_defect(
    payload: DefectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.MAINTENANCE_OFFICER, Role.DISPATCHER, Role.INSTRUCTOR)),
):
    """
    **MAINTENANCE_OFFICER / DISPATCHER / INSTRUCTOR.**

    Reporting a defect:
    1. Creates an OPEN defect record.
    2. Immediately sets the aircraft to GROUNDED.
    3. If linked to an active sortie, moves it to RECOVERY_REQUIRED.

    CRITICAL severity defects receive an extra audit flag.
    """
    return defect_service.report_defect(
        db=db,
        aircraft_id=payload.aircraft_id,
        sortie_id=payload.sortie_id,
        severity=DefectSeverity(payload.severity),
        description=payload.description,
        actor=current_user,
    )


@router.get("", response_model=list[DefectOut], summary="List defects with optional filters")
def list_defects(
    aircraft_id: int | None = Query(default=None),
    sortie_id: int | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    All authenticated users. Filter by `aircraft_id`, `sortie_id`, or `status` (OPEN / RESOLVED).
    """
    parsed_status: DefectStatus | None = None
    if status_filter:
        try:
            parsed_status = DefectStatus(status_filter.upper())
        except ValueError:
            raise HTTPException(status_code=422, detail=f"Invalid status: {status_filter}. Use OPEN or RESOLVED.")

    return defect_service.list_defects(
        db=db,
        aircraft_id=aircraft_id,
        sortie_id=sortie_id,
        status_filter=parsed_status,
    )


@router.get("/{defect_id}", response_model=DefectOut, summary="Get a single defect")
def get_defect(
    defect_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """All authenticated users."""
    from app.db.models import Defect
    defect = db.query(Defect).filter(Defect.id == defect_id).first()
    if not defect:
        raise HTTPException(status_code=404, detail="Defect not found")
    return defect


@router.patch("/{defect_id}/resolve", response_model=DefectOut,
              summary="Resolve a defect with a mandatory recovery decision")
def resolve_defect(
    defect_id: int,
    payload: ResolveDefectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.MAINTENANCE_OFFICER)),
):
    """
    **MAINTENANCE_OFFICER only.**

    Resolving a defect:
    1. Marks defect as RESOLVED and stores the recovery decision.
    2. If all defects for the linked sortie are resolved and the sortie
       is RECOVERY_REQUIRED, it is automatically moved back to LANDED.
    3. Aircraft is **NOT** automatically un-grounded. Use
       `PATCH /aircraft/{id}/ready` to release the aircraft after all defects
       are resolved.

    `recovery_decision` minimum 10 characters.
    """
    return defect_service.resolve_defect(db, defect_id, payload.recovery_decision, current_user)
