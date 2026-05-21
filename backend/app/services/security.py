from fastapi import Header, HTTPException
from sqlalchemy.orm import Session

from app.db.models import Role, User


def require_user(db: Session, x_user_id: int | None = Header(default=None), x_role: str | None = Header(default=None)) -> User:
    if x_user_id is None:
        raise HTTPException(status_code=401, detail="x-user-id header required")
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="user not found")
    if x_role and user.role.value != x_role:
        raise HTTPException(status_code=403, detail="role mismatch")
    return user


def require_roles(user: User, allowed: set[Role]):
    if user.role not in allowed and user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="insufficient role")
