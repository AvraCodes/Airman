"""
Audit log routes — read-only, ADMIN + DISPATCHER access.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.db.database import get_db
from app.db.models import AuditLog, Role, User
from app.schemas.audit_log import AuditLogOut

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


@router.get("", response_model=list[AuditLogOut])
def list_audit_logs(
    entity_type: str | None = Query(default=None),
    entity_id: int | None = Query(default=None),
    actor_id: int | None = Query(default=None),
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN, Role.DISPATCHER)),
):
    """ADMIN / DISPATCHER: paginated audit log with optional filters."""
    q = db.query(AuditLog)
    if entity_type:
        q = q.filter(AuditLog.entity_type == entity_type)
    if entity_id is not None:
        q = q.filter(AuditLog.entity_id == entity_id)
    if actor_id is not None:
        q = q.filter(AuditLog.actor_id == actor_id)
    return q.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
