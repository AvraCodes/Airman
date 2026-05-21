"""
SQLAlchemy ORM models for Skynet Aviation Operations System.
Alembic-ready with proper indexes, cascade rules, and relationships.
"""
import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


# ──────────────────────────────── Enums ─────────────────────────────────────


class Role(str, enum.Enum):
    ADMIN = "ADMIN"
    DISPATCHER = "DISPATCHER"
    INSTRUCTOR = "INSTRUCTOR"
    CFI = "CFI"
    CADET = "CADET"
    MAINTENANCE_OFFICER = "MAINTENANCE_OFFICER"


class AircraftStatus(str, enum.Enum):
    READY = "READY"
    SCHEDULED = "SCHEDULED"
    AIRBORNE = "AIRBORNE"
    LANDED = "LANDED"
    GROUNDED = "GROUNDED"
    MAINTENANCE = "MAINTENANCE"


class SortieStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    RELEASED = "RELEASED"
    AIRBORNE = "AIRBORNE"
    LANDED = "LANDED"
    TRAINING_SUBMITTED = "TRAINING_SUBMITTED"
    TRAINING_APPROVED = "TRAINING_APPROVED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"
    AIRCRAFT_GROUNDED = "AIRCRAFT_GROUNDED"
    RECOVERY_REQUIRED = "RECOVERY_REQUIRED"


class TrainingStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class DefectSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class DefectStatus(str, enum.Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"


# ──────────────────────────────── Models ─────────────────────────────────────


class BaseStation(Base):
    """Air base / operating location."""

    __tablename__ = "bases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, server_default=func.now(), nullable=False
    )

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="base", lazy="select")
    aircraft: Mapped[list["Aircraft"]] = relationship(
        "Aircraft", back_populates="base", cascade="all, delete-orphan", lazy="select"
    )
    sorties: Mapped[list["Sortie"]] = relationship("Sortie", back_populates="base", lazy="select")


class User(Base):
    """System user — every human actor has one record."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String(200), nullable=True)
    role: Mapped[Role] = mapped_column(Enum(Role), nullable=False, index=True)
    base_id: Mapped[int | None] = mapped_column(ForeignKey("bases.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, server_default=func.now(), nullable=False
    )

    # Relationships
    base: Mapped["BaseStation | None"] = relationship("BaseStation", back_populates="users", lazy="select")
    cadet_sorties: Mapped[list["Sortie"]] = relationship(
        "Sortie", foreign_keys="Sortie.cadet_id", back_populates="cadet", lazy="select"
    )
    instructor_sorties: Mapped[list["Sortie"]] = relationship(
        "Sortie", foreign_keys="Sortie.instructor_id", back_populates="instructor", lazy="select"
    )
    reported_defects: Mapped[list["Defect"]] = relationship(
        "Defect", foreign_keys="Defect.reported_by", back_populates="reporter", lazy="select"
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog", foreign_keys="AuditLog.actor_id", back_populates="actor", lazy="select"
    )
    approved_training: Mapped[list["TrainingProgress"]] = relationship(
        "TrainingProgress", foreign_keys="TrainingProgress.approved_by", back_populates="approver", lazy="select"
    )


class Aircraft(Base):
    """Aircraft asset tracked by the system."""

    __tablename__ = "aircraft"
    __table_args__ = (
        Index("ix_aircraft_base_status", "base_id", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    registration: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    aircraft_type: Mapped[str] = mapped_column(String(120), nullable=False)
    base_id: Mapped[int] = mapped_column(ForeignKey("bases.id", ondelete="RESTRICT"), nullable=False, index=True)
    status: Mapped[AircraftStatus] = mapped_column(
        Enum(AircraftStatus), default=AircraftStatus.READY, nullable=False, index=True
    )
    tbo_remaining_hours: Mapped[int] = mapped_column(Integer, default=1000)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, server_default=func.now(), nullable=False
    )

    # Relationships
    base: Mapped["BaseStation"] = relationship("BaseStation", back_populates="aircraft", lazy="select")
    sorties: Mapped[list["Sortie"]] = relationship("Sortie", back_populates="aircraft", lazy="select")
    defects: Mapped[list["Defect"]] = relationship(
        "Defect", back_populates="aircraft", cascade="all, delete-orphan", lazy="select"
    )


class Sortie(Base):
    """A single training flight event."""

    __tablename__ = "sorties"
    __table_args__ = (
        Index("ix_sorties_cadet_status", "cadet_id", "status"),
        Index("ix_sorties_instructor_status", "instructor_id", "status"),
        Index("ix_sorties_scheduled_start", "scheduled_start"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sortie_number: Mapped[str] = mapped_column(String(40), unique=True, nullable=False, index=True)
    cadet_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    instructor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    aircraft_id: Mapped[int] = mapped_column(ForeignKey("aircraft.id", ondelete="RESTRICT"), nullable=False, index=True)
    base_id: Mapped[int] = mapped_column(ForeignKey("bases.id", ondelete="RESTRICT"), nullable=False, index=True)
    lesson_type: Mapped[str] = mapped_column(String(120), nullable=False)
    scheduled_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    scheduled_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    actual_start: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    actual_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[SortieStatus] = mapped_column(
        Enum(SortieStatus), default=SortieStatus.SCHEDULED, nullable=False, index=True
    )
    delay_minutes: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=func.now(), nullable=False
    )

    # Relationships
    aircraft: Mapped["Aircraft"] = relationship("Aircraft", back_populates="sorties", lazy="select")
    cadet: Mapped["User"] = relationship("User", foreign_keys=[cadet_id], back_populates="cadet_sorties", lazy="select")
    instructor: Mapped["User"] = relationship(
        "User", foreign_keys=[instructor_id], back_populates="instructor_sorties", lazy="select"
    )
    base: Mapped["BaseStation"] = relationship("BaseStation", back_populates="sorties", lazy="select")
    training_records: Mapped[list["TrainingProgress"]] = relationship(
        "TrainingProgress",
        foreign_keys="TrainingProgress.sortie_id",
        back_populates="sortie",
        cascade="all, delete-orphan",
        lazy="select",
    )
    defects: Mapped[list["Defect"]] = relationship(
        "Defect", foreign_keys="Defect.sortie_id", back_populates="sortie", lazy="select"
    )


class TrainingProgress(Base):
    """Post-sortie training evaluation submitted by instructor, approved by CFI."""

    __tablename__ = "training_progress"
    __table_args__ = (
        Index("ix_training_cadet_status", "cadet_id", "status"),
        Index("ix_training_sortie", "sortie_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sortie_id: Mapped[int] = mapped_column(ForeignKey("sorties.id", ondelete="CASCADE"), nullable=False, index=True)
    cadet_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    instructor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    lesson_type: Mapped[str] = mapped_column(String(120), nullable=False)
    maneuver_score: Mapped[int] = mapped_column(Integer, default=0)
    communication_score: Mapped[int] = mapped_column(Integer, default=0)
    situational_awareness_score: Mapped[int] = mapped_column(Integer, default=0)
    remarks: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[TrainingStatus] = mapped_column(
        Enum(TrainingStatus), default=TrainingStatus.DRAFT, nullable=False, index=True
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    sortie: Mapped["Sortie"] = relationship(
        "Sortie", foreign_keys=[sortie_id], back_populates="training_records", lazy="select"
    )
    cadet: Mapped["User"] = relationship("User", foreign_keys=[cadet_id], lazy="select")
    instructor: Mapped["User"] = relationship("User", foreign_keys=[instructor_id], lazy="select")
    approver: Mapped["User | None"] = relationship(
        "User", foreign_keys=[approved_by], back_populates="approved_training", lazy="select"
    )


class Defect(Base):
    """Aircraft defect / snag reported during or after a sortie."""

    __tablename__ = "defects"
    __table_args__ = (
        Index("ix_defects_aircraft_status", "aircraft_id", "status"),
        Index("ix_defects_sortie", "sortie_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    aircraft_id: Mapped[int] = mapped_column(ForeignKey("aircraft.id", ondelete="CASCADE"), nullable=False, index=True)
    sortie_id: Mapped[int | None] = mapped_column(ForeignKey("sorties.id", ondelete="SET NULL"), nullable=True, index=True)
    reported_by: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    severity: Mapped[DefectSeverity] = mapped_column(Enum(DefectSeverity), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[DefectStatus] = mapped_column(
        Enum(DefectStatus), default=DefectStatus.OPEN, nullable=False, index=True
    )
    recovery_decision: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, server_default=func.now(), nullable=False
    )

    # Relationships
    aircraft: Mapped["Aircraft"] = relationship("Aircraft", back_populates="defects", lazy="select")
    sortie: Mapped["Sortie | None"] = relationship(
        "Sortie", foreign_keys=[sortie_id], back_populates="defects", lazy="select"
    )
    reporter: Mapped["User"] = relationship("User", foreign_keys=[reported_by], back_populates="reported_defects", lazy="select")


class AuditLog(Base):
    """Immutable audit trail for all state changes in the system."""

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_actor_action", "actor_id", "action"),
        Index("ix_audit_entity", "entity_type", "entity_id"),
        Index("ix_audit_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    actor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False)
    old_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, server_default=func.now(), nullable=False
    )

    # Relationships
    actor: Mapped["User"] = relationship("User", foreign_keys=[actor_id], back_populates="audit_logs", lazy="select")
