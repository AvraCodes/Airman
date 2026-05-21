"""
Aircraft readiness routes — delegates to aircraft_service and defect_service.

Endpoints:
  GET    /aircraft              — list all aircraft (with defect summary)
  GET    /aircraft/{id}         — get single aircraft
  POST   /aircraft              — register new aircraft
  PATCH  /aircraft/{id}/ground  — manually ground an aircraft
  PATCH  /aircraft/{id}/ready   — release aircraft to READY (all defects must be resolved)
  PATCH  /aircraft/{id}/maintenance — send to scheduled maintenance
  GET    /aircraft/readiness    — summary counts for dashboard
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_roles
from app.db.database import get_db
from app.db.models import Aircraft, Defect, DefectStatus, Role, User
from app.schemas.aircraft import AircraftCreate, AircraftOut, AircraftWithDefectSummary
from app.services import aircraft_service
from app.services.audit_service import create_audit_log

router = APIRouter(prefix="/aircraft", tags=["aircraft"])


def _enrich_with_defects(db: Session, aircraft_list: list[Aircraft]) -> list[dict]:
    """Add open/resolved defect counts to each aircraft dict."""
    result = []
    for a in aircraft_list:
        open_count = db.query(Defect).filter(
            Defect.aircraft_id == a.id, Defect.status == DefectStatus.OPEN
        ).count()
        resolved_count = db.query(Defect).filter(
            Defect.aircraft_id == a.id, Defect.status == DefectStatus.RESOLVED
        ).count()
        d = {c.name: getattr(a, c.name) for c in a.__table__.columns}
        d["open_defects"] = open_count
        d["resolved_defects"] = resolved_count
        result.append(d)
    return result


# ── List ─────────────────────────────────────────────────────────────────────

@router.get("/readiness", summary="Aircraft readiness summary for dashboard")
def readiness_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns counts of aircraft by status (READY, GROUNDED, AIRBORNE, etc.)."""
    return aircraft_service.get_aircraft_readiness_summary(db)


@router.get("", response_model=list[AircraftWithDefectSummary], summary="List all aircraft with defect counts")
def list_aircraft(
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """All authenticated users. Optional `?status=GROUNDED` filter."""
    from app.db.models import AircraftStatus
    q = db.query(Aircraft)
    if status_filter:
        try:
            q = q.filter(Aircraft.status == AircraftStatus(status_filter.upper()))
        except ValueError:
            raise HTTPException(status_code=422, detail=f"Invalid status filter: {status_filter}")
    aircraft_list = q.order_by(Aircraft.registration).all()
    return _enrich_with_defects(db, aircraft_list)


@router.get("/{aircraft_id}", response_model=AircraftWithDefectSummary, summary="Get aircraft detail with defect counts")
def get_aircraft(
    aircraft_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    aircraft = db.query(Aircraft).filter(Aircraft.id == aircraft_id).first()
    if not aircraft:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    return _enrich_with_defects(db, [aircraft])[0]


# ── Create ────────────────────────────────────────────────────────────────────

@router.post("", response_model=AircraftOut, status_code=status.HTTP_201_CREATED,
             summary="Register a new aircraft")
def create_aircraft(
    payload: AircraftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.DISPATCHER)),
):
    """**ADMIN / DISPATCHER.** Register a new aircraft into the fleet."""
    existing = db.query(Aircraft).filter(Aircraft.registration == payload.registration).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Aircraft {payload.registration} already registered")
    aircraft = Aircraft(**payload.model_dump())
    db.add(aircraft)
    db.commit()
    db.refresh(aircraft)
    create_audit_log(db, current_user.id, "AIRCRAFT_CREATED", "aircraft", aircraft.id, None, aircraft.status.value)
    return aircraft


# ── Status Transitions ────────────────────────────────────────────────────────

@router.patch("/{aircraft_id}/ground", response_model=AircraftOut,
              summary="Manually ground an aircraft")
def ground_aircraft(
    aircraft_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.MAINTENANCE_OFFICER, Role.DISPATCHER)),
):
    """
    **MAINTENANCE_OFFICER / DISPATCHER.** Force aircraft to GROUNDED status.

    Constraint: Cannot ground an AIRBORNE aircraft.
    """
    return aircraft_service.ground_aircraft(db, aircraft_id, current_user)


@router.patch("/{aircraft_id}/ready", response_model=AircraftOut,
              summary="Release aircraft back to READY")
def release_aircraft(
    aircraft_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.MAINTENANCE_OFFICER)),
):
    """
    **MAINTENANCE_OFFICER only.**

    Aircraft must have ZERO open defects before it can be released to READY.
    If any open defects remain, a 400 is returned with the count.
    """
    return aircraft_service.release_aircraft_to_ready(db, aircraft_id, current_user)


@router.patch("/{aircraft_id}/maintenance", response_model=AircraftOut,
              summary="Send aircraft to scheduled maintenance")
def send_to_maintenance(
    aircraft_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.MAINTENANCE_OFFICER, Role.DISPATCHER)),
):
    """
    **MAINTENANCE_OFFICER / DISPATCHER.** Move aircraft to MAINTENANCE status
    (scheduled deep maintenance — distinct from defect-triggered GROUNDED).
    """
    return aircraft_service.send_to_maintenance(db, aircraft_id, current_user)
