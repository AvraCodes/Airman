"""Pydantic schemas for AuditLog."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_id: int
    action: str
    entity_type: str
    entity_id: int
    old_value: str | None
    new_value: str | None
    created_at: datetime
