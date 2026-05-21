"""
Application entry point.
Configures CORS, lifespan (DB init + seed), and router includes.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.api.routes import aircraft, audit_logs, auth, defects, sorties, training_progress, users
from app.core.config import settings
from app.db.database import Base, SessionLocal, engine
from app.db.models import User
from app.db.seed import run_seed


import traceback

def _ensure_seed() -> None:
    """Run seed only when the database is empty."""
    db: Session = SessionLocal()
    try:
        has_users = db.query(User).first() is not None
    except Exception:
        has_users = False
    finally:
        db.close()
    if not has_users:
        try:
            run_seed(drop_tables=False)
        except Exception as e:
            # Safe ignore concurrent seeding collisions on multi-instance serverless starts
            print(f"Database seed skipped or handled concurrently: {e}")
            traceback.print_exc()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _ensure_seed()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Skynet aviation operations API — sorties, training, aircraft readiness, defects, RBAC.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(aircraft.router)
app.include_router(sorties.router)
app.include_router(training_progress.router)
app.include_router(defects.router)
app.include_router(audit_logs.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "version": settings.app_version}
