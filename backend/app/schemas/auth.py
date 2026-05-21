"""
Pydantic schemas for authentication endpoints.
"""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator

from app.db.models import Role


class LoginRequest(BaseModel):
    """Login credentials — email is validated loosely to support .local/.test domains."""
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.strip().lower()


class TokenData(BaseModel):
    sub: str       # user_id as string
    role: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    role: Role
    base_id: int | None
    created_at: datetime | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ResolveDefectRequest moved to app.schemas.aircraft
