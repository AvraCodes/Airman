"""
Password hashing utilities using bcrypt directly.
Passlib has a known compatibility issue with bcrypt >= 4.x and Python 3.14;
we call bcrypt directly to avoid it.
"""
import bcrypt


def hash_password(plain: str) -> str:
    """Hash a plain-text password with bcrypt."""
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return bcrypt.checkpw(plain.encode(), hashed.encode())
