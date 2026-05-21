"""
Seed data with hashed passwords for all demo users.
Each user's default password is their role in lowercase, e.g. admin, dispatcher, etc.
"""
from datetime import datetime, timedelta

from app.core.hashing import hash_password
from app.db.database import Base, SessionLocal, engine
from app.db.models import (
    Aircraft, AircraftStatus, BaseStation,
    Defect, DefectSeverity, DefectStatus,
    Role, Sortie, SortieStatus,
    TrainingProgress, TrainingStatus, User,
)
from app.services.audit_service import create_audit_log


def run_seed() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # ── Bases ──────────────────────────────────────────────────────────
        b1 = BaseStation(name="Bengaluru Air Base", code="BLR", location="Bengaluru, Karnataka")
        b2 = BaseStation(name="Hyderabad Air Base", code="HYD", location="Hyderabad, Telangana")
        db.add_all([b1, b2])
        db.commit()
        db.refresh(b1)
        db.refresh(b2)

        # ── Users (password = role.lower()) ────────────────────────────────
        users = [
            User(full_name="Admin User",           email="admin@airman.local",      hashed_password=hash_password("admin"),       role=Role.ADMIN,               base_id=b1.id),
            User(full_name="Dispatch Officer",     email="dispatcher@airman.local", hashed_password=hash_password("dispatcher"),  role=Role.DISPATCHER,          base_id=b1.id),
            User(full_name="Capt. Rao",            email="instructor@airman.local", hashed_password=hash_password("instructor"),  role=Role.INSTRUCTOR,          base_id=b1.id),
            User(full_name="Chief Flying Instr.",  email="cfi@airman.local",        hashed_password=hash_password("cfi"),         role=Role.CFI,                 base_id=b1.id),
            User(full_name="Arjun Menon",          email="cadet@airman.local",      hashed_password=hash_password("cadet"),       role=Role.CADET,               base_id=b1.id),
            User(full_name="Maintenance Officer",  email="mo@airman.local",         hashed_password=hash_password("mo"),          role=Role.MAINTENANCE_OFFICER, base_id=b1.id),
        ]
        db.add_all(users)
        db.commit()
        for u in users:
            db.refresh(u)

        admin, dispatcher, instructor, cfi, cadet, mo = users

        # ── Aircraft ───────────────────────────────────────────────────────
        a1 = Aircraft(registration="VT-ABC", aircraft_type="Cessna 172",   base_id=b1.id, status=AircraftStatus.READY,    tbo_remaining_hours=120)
        a2 = Aircraft(registration="VT-SKY", aircraft_type="Piper PA-28",  base_id=b1.id, status=AircraftStatus.GROUNDED, tbo_remaining_hours=80)
        a3 = Aircraft(registration="VT-AIR", aircraft_type="Diamond DA40", base_id=b2.id, status=AircraftStatus.READY,    tbo_remaining_hours=140)
        db.add_all([a1, a2, a3])
        db.commit()
        for a in [a1, a2, a3]:
            db.refresh(a)

        # ── Sorties ────────────────────────────────────────────────────────
        now = datetime.utcnow()
        sorties = [
            Sortie(sortie_number="SRT-001", cadet_id=cadet.id, instructor_id=instructor.id, aircraft_id=a1.id, base_id=b1.id, lesson_type="Circuits",   scheduled_start=now,                       scheduled_end=now + timedelta(hours=1), status=SortieStatus.SCHEDULED),
            Sortie(sortie_number="SRT-002", cadet_id=cadet.id, instructor_id=instructor.id, aircraft_id=a3.id, base_id=b2.id, lesson_type="Navigation",  scheduled_start=now,                       scheduled_end=now + timedelta(hours=1), status=SortieStatus.RELEASED),
            Sortie(sortie_number="SRT-003", cadet_id=cadet.id, instructor_id=instructor.id, aircraft_id=a1.id, base_id=b1.id, lesson_type="Stalls",      scheduled_start=now,                       scheduled_end=now + timedelta(hours=1), status=SortieStatus.AIRBORNE,  actual_start=now),
            Sortie(sortie_number="SRT-004", cadet_id=cadet.id, instructor_id=instructor.id, aircraft_id=a3.id, base_id=b2.id, lesson_type="Pattern Work", scheduled_start=now - timedelta(hours=2), scheduled_end=now - timedelta(hours=1), status=SortieStatus.LANDED,   actual_start=now - timedelta(hours=2), actual_end=now - timedelta(hours=1)),
            Sortie(sortie_number="SRT-005", cadet_id=cadet.id, instructor_id=instructor.id, aircraft_id=a1.id, base_id=b1.id, lesson_type="Emergency Procedures", scheduled_start=now - timedelta(hours=4), scheduled_end=now - timedelta(hours=3), status=SortieStatus.TRAINING_SUBMITTED, actual_start=now - timedelta(hours=4), actual_end=now - timedelta(hours=3)),
        ]
        db.add_all(sorties)
        db.commit()
        for s in sorties:
            db.refresh(s)

        s1, s2, s3, s4, s5 = sorties

        # ── Training Progress ──────────────────────────────────────────────
        t1 = TrainingProgress(
            sortie_id=s4.id, cadet_id=cadet.id, instructor_id=instructor.id,
            lesson_type="Pattern Work", maneuver_score=4, communication_score=4,
            situational_awareness_score=4, remarks="Good handling. Ready for next level.",
            status=TrainingStatus.SUBMITTED, submitted_at=now - timedelta(hours=1),
        )
        t2 = TrainingProgress(
            sortie_id=s5.id, cadet_id=cadet.id, instructor_id=instructor.id,
            lesson_type="Emergency Procedures", maneuver_score=3, communication_score=4,
            situational_awareness_score=3, remarks="Needs more checklist discipline under pressure.",
            status=TrainingStatus.DRAFT,
        )
        db.add_all([t1, t2])
        db.commit()

        # ── Defects ────────────────────────────────────────────────────────
        d1 = Defect(aircraft_id=a2.id, sortie_id=s4.id, reported_by=mo.id, severity=DefectSeverity.HIGH,   description="Hydraulic leak observed during post-flight inspection.", status=DefectStatus.OPEN)
        d2 = Defect(aircraft_id=a1.id, sortie_id=s5.id, reported_by=mo.id, severity=DefectSeverity.MEDIUM, description="Radio intermittent on COM1.", status=DefectStatus.RESOLVED, recovery_decision="Cleared after bench test and connector re-seat.")
        db.add_all([d1, d2])
        db.commit()

        # ── Audit seed logs ────────────────────────────────────────────────
        create_audit_log(db, dispatcher.id, "SEED_SORTIE_CREATED", "sortie", s1.id, None, SortieStatus.SCHEDULED.value)
        create_audit_log(db, mo.id,         "SEED_DEFECT_CREATED", "defect", d1.id, None, DefectStatus.OPEN.value)

    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
