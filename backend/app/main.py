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
    """Run idempotent seed on startup to ensure all demo data and credentials are populated and up to date."""
    try:
        run_seed(drop_tables=False)
        print("Database seeded and verified successfully.")
    except Exception as e:
        # Safe ignore concurrent seeding collisions on multi-instance serverless starts
        print(f"Database seed handled concurrently or skipped: {e}")
        traceback.print_exc()


def _verify_and_update_schema() -> None:
    """Ensure that the database schema is up-to-date by applying missing columns/updates directly if needed."""
    from sqlalchemy import text
    db: Session = SessionLocal()
    try:
        bind_engine = db.get_bind()
        is_pg = "postgresql" in str(bind_engine.url)
        
        # Safe alter table to add hashed_password column if it doesn't exist
        if is_pg:
            db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(200)"))
        else:
            try:
                db.execute(text("ALTER TABLE users ADD COLUMN hashed_password VARCHAR(200)"))
            except Exception:
                pass  # Ignore if column already exists
        db.commit()
    except Exception as e:
        print(f"Schema auto-update skipped or handled: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _verify_and_update_schema()
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
