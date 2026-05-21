"""
FastAPI security dependencies: JWT parsing, current-user extraction, RBAC guards.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.token import decode_access_token
from app.db.database import get_db
from app.db.models import Role, User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency that validates a Bearer JWT and returns the authenticated User.

    Raises 401 if the token is missing, malformed, or the user no longer exists.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exc
    return user


def require_roles(*roles: Role):
    """
    Dependency factory for RBAC route protection.

    Usage::

        @router.get("/admin-only")
        def admin(user = Depends(require_roles(Role.ADMIN))):
            ...

    ADMIN users always pass regardless of listed roles.
    """
    def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == Role.ADMIN:
            return current_user
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of: {[r.value for r in roles]}",
            )
        return current_user

    return _check


def enforce_role(user: User, allowed: set[Role]) -> None:
    """Inline RBAC check — raises 403 if user's role is not in allowed set."""
    if user.role not in allowed and user.role != Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient role for this action",
        )
