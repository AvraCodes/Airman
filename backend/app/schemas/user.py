"""Pydantic schemas for User."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr
from app.db.models import Role


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: Role
    base_id: int | None
    created_at: datetime


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Role
    base_id: int | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: Role | None = None
    base_id: int | None = None
