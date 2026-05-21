"""Pydantic schemas for Sortie — full validation."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from app.db.models import SortieStatus


class SortieCreate(BaseModel):
    sortie_number: str = Field(..., min_length=1, max_length=40, description="Unique sortie identifier, e.g. SRT-042")
    cadet_id: int = Field(..., gt=0)
    instructor_id: int = Field(..., gt=0)
    aircraft_id: int = Field(..., gt=0)
    base_id: int = Field(..., gt=0)
    lesson_type: str = Field(..., min_length=1, max_length=120)
    scheduled_start: datetime
    scheduled_end: datetime
    delay_minutes: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def validate_schedule(self) -> "SortieCreate":
        if self.scheduled_start >= self.scheduled_end:
            raise ValueError("scheduled_start must be before scheduled_end")
        return self

    @field_validator("sortie_number")
    @classmethod
    def normalise_sortie_number(cls, v: str) -> str:
        return v.strip().upper()


class SortieOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sortie_number: str
    cadet_id: int
    instructor_id: int
    aircraft_id: int
    base_id: int
    lesson_type: str
    scheduled_start: datetime
    scheduled_end: datetime
    actual_start: datetime | None
    actual_end: datetime | None
    status: SortieStatus
    delay_minutes: int
    created_at: datetime
    updated_at: datetime


class SortieUpdate(BaseModel):
    delay_minutes: int | None = Field(default=None, ge=0)
    lesson_type: str | None = Field(default=None, min_length=1, max_length=120)


class SortieStatusResponse(SortieOut):
    """Extended response with computed fields for state transitions."""
    flight_duration_minutes: int | None = None

    @classmethod
    def from_sortie(cls, sortie: "Sortie") -> "SortieStatusResponse":  # type: ignore[name-defined]
        data = {c.name: getattr(sortie, c.name) for c in sortie.__table__.columns}
        duration = None
        if sortie.actual_start and sortie.actual_end:
            duration = int((sortie.actual_end - sortie.actual_start).total_seconds() / 60)
        data["flight_duration_minutes"] = duration
        return cls.model_validate(data)
