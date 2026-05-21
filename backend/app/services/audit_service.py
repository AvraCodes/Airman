"""Audit log service — helper used across all route handlers."""
from sqlalchemy.orm import Session
from app.db.models import AuditLog


def create_audit_log(
    db: Session,
    actor_id: int,
    action: str,
    entity_type: str,
    entity_id: int,
    old_value: str | None,
    new_value: str | None,
) -> AuditLog:
    log = AuditLog(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=old_value,
        new_value=new_value,
    )
    db.add(log)
    db.commit()
    return log
