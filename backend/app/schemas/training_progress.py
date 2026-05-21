"""Pydantic schemas for TrainingProgress — includes 1–5 score validation."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.db.models import TrainingStatus


def _score_field(default: int = 1) -> int:
    return Field(default=default, ge=1, le=5, description="Score from 1 (poor) to 5 (excellent)")


class TrainingProgressCreate(BaseModel):
    sortie_id: int = Field(..., gt=0)
    cadet_id: int = Field(..., gt=0)
    instructor_id: int = Field(..., gt=0)
    lesson_type: str = Field(..., min_length=1, max_length=120)
    maneuver_score: int = _score_field()
    communication_score: int = _score_field()
    situational_awareness_score: int = _score_field()
    remarks: str = Field(default="", max_length=2000)


class TrainingProgressUpdate(BaseModel):
    """Patch a DRAFT record before submission."""
    maneuver_score: int | None = Field(default=None, ge=1, le=5)
    communication_score: int | None = Field(default=None, ge=1, le=5)
    situational_awareness_score: int | None = Field(default=None, ge=1, le=5)
    remarks: str | None = Field(default=None, max_length=2000)


class TrainingProgressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sortie_id: int
    cadet_id: int
    instructor_id: int
    lesson_type: str
    maneuver_score: int
    communication_score: int
    situational_awareness_score: int
    remarks: str
    status: TrainingStatus
    submitted_at: datetime | None
    approved_by: int | None
    approved_at: datetime | None

    @property
    def average_score(self) -> float:
        return round(
            (self.maneuver_score + self.communication_score + self.situational_awareness_score) / 3, 2
        )


class RejectTrainingRequest(BaseModel):
    remarks: str = Field(..., min_length=10, max_length=1000, description="Reason for rejection — minimum 10 characters")

    @field_validator("remarks")
    @classmethod
    def non_empty_remarks(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Rejection remarks cannot be blank")
        return v.strip()
