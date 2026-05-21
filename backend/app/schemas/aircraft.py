"""Pydantic schemas for Aircraft and Defect."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.db.models import AircraftStatus, DefectSeverity, DefectStatus


# ── Aircraft ──────────────────────────────────────────────────────────────────

class AircraftOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    registration: str
    aircraft_type: str
    base_id: int
    status: AircraftStatus
    tbo_remaining_hours: int
    created_at: datetime


class AircraftWithDefectSummary(AircraftOut):
    """Extends AircraftOut with live defect counts for readiness board."""
    open_defects: int = 0
    resolved_defects: int = 0


class AircraftCreate(BaseModel):
    registration: str = Field(..., min_length=1, max_length=20)
    aircraft_type: str = Field(..., min_length=1, max_length=120)
    base_id: int = Field(..., gt=0)
    status: AircraftStatus = AircraftStatus.READY
    tbo_remaining_hours: int = Field(default=1000, ge=0)


class AircraftStatusUpdate(BaseModel):
    status: AircraftStatus


# ── Defect ────────────────────────────────────────────────────────────────────

class DefectCreate(BaseModel):
    aircraft_id: int = Field(..., gt=0)
    sortie_id: int | None = Field(default=None, gt=0)
    severity: DefectSeverity
    description: str = Field(..., min_length=5, max_length=2000, description="Detailed defect description — minimum 5 chars")


class DefectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    aircraft_id: int
    sortie_id: int | None
    reported_by: int
    severity: DefectSeverity
    description: str
    status: DefectStatus
    recovery_decision: str | None
    created_at: datetime


class ResolveDefectRequest(BaseModel):
    recovery_decision: str = Field(
        ..., min_length=10, max_length=2000,
        description="Mandatory recovery action taken — minimum 10 characters",
    )
