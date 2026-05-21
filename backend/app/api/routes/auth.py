"""
Auth routes — login with email/password, JWT response, and /me endpoint.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.hashing import verify_password
from app.core.security import get_current_user
from app.core.token import create_access_token
from app.db.database import get_db
from app.db.models import User
from app.schemas.auth import LoginRequest, LoginResponse, TokenData, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse, summary="Authenticate and obtain a JWT")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a user by email and password.

    Returns a Bearer JWT access token plus basic user info.

    **RBAC note:** All roles may call this endpoint — no restriction.
    """
    user = db.query(User).filter(User.email == payload.email).first()

    # When password is not yet set (seed data), accept any password for dev convenience
    # In production every user has a hashed_password set during onboarding
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if user.hashed_password is not None:
        if not verify_password(payload.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
    # else: seed users have no password set — allow login for demo/assessment

    token_data = TokenData(sub=str(user.id), role=user.role.value)
    access_token = create_access_token(data=token_data.model_dump())

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.get("/me", response_model=UserOut, summary="Return the currently authenticated user")
def me(current_user: User = Depends(get_current_user)):
    """
    Return the profile of the currently authenticated user.

    Requires a valid Bearer JWT in the ``Authorization`` header.
    """
    return UserOut.model_validate(current_user)
