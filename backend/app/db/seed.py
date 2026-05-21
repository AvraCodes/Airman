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


def run_seed(drop_tables: bool = False) -> None:
    if drop_tables:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # ── Bases ──────────────────────────────────────────────────────────
        b1 = db.query(BaseStation).filter(BaseStation.code == "BLR").first()
        if not b1:
            b1 = BaseStation(name="Bengaluru Air Base", code="BLR", location="Bengaluru, Karnataka")
            db.add(b1)
            db.commit()
            db.refresh(b1)
        else:
            b1.name = "Bengaluru Air Base"
            b1.location = "Bengaluru, Karnataka"
            db.commit()

        b2 = db.query(BaseStation).filter(BaseStation.code == "HYD").first()
        if not b2:
            b2 = BaseStation(name="Hyderabad Air Base", code="HYD", location="Hyderabad, Telangana")
            db.add(b2)
            db.commit()
            db.refresh(b2)
        else:
            b2.name = "Hyderabad Air Base"
            b2.location = "Hyderabad, Telangana"
            db.commit()

        # ── Users (password = role.lower()) ────────────────────────────────
        users_data = [
            ("Admin User",           "admin@airman.local",      "admin",       Role.ADMIN,               b1.id),
            ("Dispatch Officer",     "dispatcher@airman.local", "dispatcher",  Role.DISPATCHER,          b1.id),
            ("Capt. Rao",            "instructor@airman.local", "instructor",  Role.INSTRUCTOR,          b1.id),
            ("Chief Flying Instr.",  "cfi@airman.local",        "cfi",         Role.CFI,                 b1.id),
            ("Arjun Menon",          "cadet@airman.local",      "cadet",       Role.CADET,               b1.id),
            ("Maintenance Officer",  "mo@airman.local",         "mo",          Role.MAINTENANCE_OFFICER, b1.id),
        ]
        users = []
        for full_name, email, plain_pwd, role, base_id in users_data:
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(
                    full_name=full_name,
                    email=email,
                    hashed_password=hash_password(plain_pwd),
                    role=role,
                    base_id=base_id
                )
                db.add(u)
                db.commit()
                db.refresh(u)
            else:
                u.full_name = full_name
                u.role = role
                u.base_id = base_id
                if not u.hashed_password:
                    u.hashed_password = hash_password(plain_pwd)
                db.commit()
            users.append(u)

        admin, dispatcher, instructor, cfi, cadet, mo = users

        # ── Aircraft ───────────────────────────────────────────────────────
        aircraft_data = [
            ("VT-ABC", "Cessna 172",   b1.id, AircraftStatus.READY,    120),
            ("VT-SKY", "Piper PA-28",  b1.id, AircraftStatus.GROUNDED, 80),
            ("VT-AIR", "Diamond DA40", b2.id, AircraftStatus.READY,    140),
        ]
        aircrafts = []
        for reg, ac_type, base_id, status, tbo in aircraft_data:
            a = db.query(Aircraft).filter(Aircraft.registration == reg).first()
            if not a:
                a = Aircraft(
                    registration=reg,
                    aircraft_type=ac_type,
                    base_id=base_id,
                    status=status,
                    tbo_remaining_hours=tbo
                )
                db.add(a)
                db.commit()
                db.refresh(a)
            else:
                a.aircraft_type = ac_type
                a.base_id = base_id
                db.commit()
            aircrafts.append(a)

        a1, a2, a3 = aircrafts

        # ── Sorties ────────────────────────────────────────────────────────
        now = datetime.utcnow()
        sorties_data = [
            ("SRT-001", cadet.id, instructor.id, a1.id, b1.id, "Circuits",   now,                       now + timedelta(hours=1), SortieStatus.SCHEDULED, None, None),
            ("SRT-002", cadet.id, instructor.id, a3.id, b2.id, "Navigation",  now,                       now + timedelta(hours=1), SortieStatus.RELEASED, None, None),
            ("SRT-003", cadet.id, instructor.id, a1.id, b1.id, "Stalls",      now,                       now + timedelta(hours=1), SortieStatus.AIRBORNE,  now, None),
            ("SRT-004", cadet.id, instructor.id, a3.id, b2.id, "Pattern Work", now - timedelta(hours=2), now - timedelta(hours=1), SortieStatus.LANDED,   now - timedelta(hours=2), now - timedelta(hours=1)),
            ("SRT-005", cadet.id, instructor.id, a1.id, b1.id, "Emergency Procedures", now - timedelta(hours=4), now - timedelta(hours=3), SortieStatus.TRAINING_SUBMITTED, now - timedelta(hours=4), now - timedelta(hours=3)),
        ]
        sorties = []
        for s_num, cad_id, inst_id, ac_id, bs_id, lesson, s_start, s_end, stat, act_start, act_end in sorties_data:
            s = db.query(Sortie).filter(Sortie.sortie_number == s_num).first()
            if not s:
                s = Sortie(
                    sortie_number=s_num, cadet_id=cad_id, instructor_id=inst_id, aircraft_id=ac_id, base_id=bs_id,
                    lesson_type=lesson, scheduled_start=s_start, scheduled_end=s_end, status=stat,
                    actual_start=act_start, actual_end=act_end
                )
                db.add(s)
                db.commit()
                db.refresh(s)
            sorties.append(s)

        s1, s2, s3, s4, s5 = sorties

        # ── Training Progress ──────────────────────────────────────────────
        t1 = db.query(TrainingProgress).filter(TrainingProgress.sortie_id == s4.id).first()
        if not t1:
            t1 = TrainingProgress(
                sortie_id=s4.id, cadet_id=cadet.id, instructor_id=instructor.id,
                lesson_type="Pattern Work", maneuver_score=4, communication_score=4,
                situational_awareness_score=4, remarks="Good handling. Ready for next level.",
                status=TrainingStatus.SUBMITTED, submitted_at=now - timedelta(hours=1),
            )
            db.add(t1)
            db.commit()

        t2 = db.query(TrainingProgress).filter(TrainingProgress.sortie_id == s5.id).first()
        if not t2:
            t2 = TrainingProgress(
                sortie_id=s5.id, cadet_id=cadet.id, instructor_id=instructor.id,
                lesson_type="Emergency Procedures", maneuver_score=3, communication_score=4,
                situational_awareness_score=3, remarks="Needs more checklist discipline under pressure.",
                status=TrainingStatus.DRAFT,
            )
            db.add(t2)
            db.commit()

        # ── Defects ────────────────────────────────────────────────────────
        d1 = db.query(Defect).filter(Defect.aircraft_id == a2.id, Defect.description.like("Hydraulic leak%")).first()
        if not d1:
            d1 = Defect(aircraft_id=a2.id, sortie_id=s4.id, reported_by=mo.id, severity=DefectSeverity.HIGH,   description="Hydraulic leak observed during post-flight inspection.", status=DefectStatus.OPEN)
            db.add(d1)
            db.commit()
            db.refresh(d1)

        d2 = db.query(Defect).filter(Defect.aircraft_id == a1.id, Defect.description.like("Radio intermittent%")).first()
        if not d2:
            d2 = Defect(aircraft_id=a1.id, sortie_id=s5.id, reported_by=mo.id, severity=DefectSeverity.MEDIUM, description="Radio intermittent on COM1.", status=DefectStatus.RESOLVED, recovery_decision="Cleared after bench test and connector re-seat.")
            db.add(d2)
            db.commit()
            db.refresh(d2)

        # ── Audit seed logs ────────────────────────────────────────────────
        from app.db.models import AuditLog
        s1_audit = db.query(AuditLog).filter(AuditLog.action == "SEED_SORTIE_CREATED", AuditLog.entity_id == s1.id).first()
        if not s1_audit:
            create_audit_log(db, dispatcher.id, "SEED_SORTIE_CREATED", "sortie", s1.id, None, SortieStatus.SCHEDULED.value)

        d1_audit = db.query(AuditLog).filter(AuditLog.action == "SEED_DEFECT_CREATED", AuditLog.entity_id == d1.id).first()
        if not d1_audit:
            create_audit_log(db, mo.id,         "SEED_DEFECT_CREATED", "defect", d1.id, None, DefectStatus.OPEN.value)

    finally:
        db.close()


if __name__ == "__main__":
    run_seed(drop_tables=True)
