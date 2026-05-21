import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.hashing import hash_password
from app.core.token import create_access_token
from app.db.database import Base, get_db
from app.db.models import Aircraft, AircraftStatus, BaseStation, Role, Sortie, SortieStatus, User
from app.main import app

engine = create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def auth_headers():
    """Returns a helper function to generate Bearer token authorization headers."""
    def _headers(user_id: int, role: Role) -> dict[str, str]:
        token = create_access_token({"sub": str(user_id), "role": role.value})
        return {"Authorization": f"Bearer {token}"}
    return _headers


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    db = TestingSessionLocal()
    base = BaseStation(name="BLR Base", code="BLR", location="Bengaluru")
    db.add(base)
    db.commit()
    db.refresh(base)

    users = [
        User(full_name="Admin", email="admin@x.com", role=Role.ADMIN, base_id=base.id, hashed_password=hash_password("admin")),
        User(full_name="Neha Kapoor", email="dispatcher@x.com", role=Role.DISPATCHER, base_id=base.id, hashed_password=hash_password("dispatcher")),
        User(full_name="Arjun Menon", email="cadet@x.com", role=Role.CADET, base_id=base.id, hashed_password=hash_password("cadet")),
        User(full_name="Priya Iyer", email="instructor@x.com", role=Role.INSTRUCTOR, base_id=base.id, hashed_password=hash_password("instructor")),
        User(full_name="Rohit Sen", email="cfi@x.com", role=Role.CFI, base_id=base.id, hashed_password=hash_password("cfi")),
        User(full_name="Maya Nair", email="mo@x.com", role=Role.MAINTENANCE_OFFICER, base_id=base.id, hashed_password=hash_password("mo")),
    ]
    db.add_all(users)

    a1 = Aircraft(registration="VT-ABC", aircraft_type="Cessna 172", base_id=base.id, status=AircraftStatus.READY, tbo_remaining_hours=120)
    a2 = Aircraft(registration="VT-SKY", aircraft_type="Piper PA-28", base_id=base.id, status=AircraftStatus.GROUNDED, tbo_remaining_hours=90)
    db.add_all([a1, a2])
    db.commit()
    db.refresh(a1)

    sortie = Sortie(
        sortie_number="SRT-001",
        cadet_id=3,
        instructor_id=4,
        aircraft_id=a1.id,
        base_id=base.id,
        lesson_type="Circuit",
        scheduled_start=__import__("datetime").datetime(2026,5,19,8,0,0),
        scheduled_end=__import__("datetime").datetime(2026,5,19,9,0,0),
        status=SortieStatus.SCHEDULED,
    )
    db.add(sortie)
    db.commit()
    db.close()

    yield client

