"""Initial schema — all 7 tables for Skynet aviation operations.

Revision ID: 0001
Revises: —
Create Date: 2026-05-21
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── bases ────────────────────────────────────────────────────────────────
    op.create_table(
        "bases",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("code", sa.String(20), nullable=False),
        sa.Column("location", sa.String(120), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_bases_id",   "bases", ["id"])
    op.create_index("ix_bases_code", "bases", ["code"])

    # ── users ────────────────────────────────────────────────────────────────
    role_enum = sa.Enum("ADMIN", "DISPATCHER", "INSTRUCTOR", "CFI", "CADET", "MAINTENANCE_OFFICER", name="role")
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(120), nullable=False),
        sa.Column("hashed_password", sa.String(200), nullable=True),
        sa.Column("role", role_enum, nullable=False),
        sa.Column("base_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["base_id"], ["bases.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_id",      "users", ["id"])
    op.create_index("ix_users_email",   "users", ["email"])
    op.create_index("ix_users_role",    "users", ["role"])
    op.create_index("ix_users_base_id", "users", ["base_id"])

    # ── aircraft ─────────────────────────────────────────────────────────────
    aircraft_status_enum = sa.Enum("READY", "SCHEDULED", "AIRBORNE", "LANDED", "GROUNDED", "MAINTENANCE", name="aircraftstatus")
    op.create_table(
        "aircraft",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("registration", sa.String(20), nullable=False),
        sa.Column("aircraft_type", sa.String(120), nullable=False),
        sa.Column("base_id", sa.Integer(), nullable=False),
        sa.Column("status", aircraft_status_enum, nullable=False, server_default="READY"),
        sa.Column("tbo_remaining_hours", sa.Integer(), nullable=False, server_default="1000"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["base_id"], ["bases.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("registration"),
    )
    op.create_index("ix_aircraft_id",           "aircraft", ["id"])
    op.create_index("ix_aircraft_registration", "aircraft", ["registration"])
    op.create_index("ix_aircraft_base_id",      "aircraft", ["base_id"])
    op.create_index("ix_aircraft_status",       "aircraft", ["status"])
    op.create_index("ix_aircraft_base_status",  "aircraft", ["base_id", "status"])

    # ── sorties ──────────────────────────────────────────────────────────────
    sortie_status_enum = sa.Enum(
        "SCHEDULED", "RELEASED", "AIRBORNE", "LANDED",
        "TRAINING_SUBMITTED", "TRAINING_APPROVED", "CLOSED",
        "CANCELLED", "AIRCRAFT_GROUNDED", "RECOVERY_REQUIRED",
        name="sortiestatus",
    )
    op.create_table(
        "sorties",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sortie_number", sa.String(40), nullable=False),
        sa.Column("cadet_id", sa.Integer(), nullable=False),
        sa.Column("instructor_id", sa.Integer(), nullable=False),
        sa.Column("aircraft_id", sa.Integer(), nullable=False),
        sa.Column("base_id", sa.Integer(), nullable=False),
        sa.Column("lesson_type", sa.String(120), nullable=False),
        sa.Column("scheduled_start", sa.DateTime(), nullable=False),
        sa.Column("scheduled_end", sa.DateTime(), nullable=False),
        sa.Column("actual_start", sa.DateTime(), nullable=True),
        sa.Column("actual_end", sa.DateTime(), nullable=True),
        sa.Column("status", sortie_status_enum, nullable=False, server_default="SCHEDULED"),
        sa.Column("delay_minutes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["aircraft_id"], ["aircraft.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["base_id"],     ["bases.id"],    ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["cadet_id"],    ["users.id"],    ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["instructor_id"], ["users.id"],  ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sortie_number"),
    )
    op.create_index("ix_sorties_id",               "sorties", ["id"])
    op.create_index("ix_sorties_sortie_number",    "sorties", ["sortie_number"])
    op.create_index("ix_sorties_cadet_id",         "sorties", ["cadet_id"])
    op.create_index("ix_sorties_instructor_id",    "sorties", ["instructor_id"])
    op.create_index("ix_sorties_aircraft_id",      "sorties", ["aircraft_id"])
    op.create_index("ix_sorties_base_id",          "sorties", ["base_id"])
    op.create_index("ix_sorties_status",           "sorties", ["status"])
    op.create_index("ix_sorties_scheduled_start",  "sorties", ["scheduled_start"])
    op.create_index("ix_sorties_cadet_status",     "sorties", ["cadet_id", "status"])
    op.create_index("ix_sorties_instructor_status","sorties", ["instructor_id", "status"])

    # ── training_progress ─────────────────────────────────────────────────────
    training_status_enum = sa.Enum("DRAFT", "SUBMITTED", "APPROVED", "REJECTED", name="trainingstatus")
    op.create_table(
        "training_progress",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sortie_id", sa.Integer(), nullable=False),
        sa.Column("cadet_id", sa.Integer(), nullable=False),
        sa.Column("instructor_id", sa.Integer(), nullable=False),
        sa.Column("lesson_type", sa.String(120), nullable=False),
        sa.Column("maneuver_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("communication_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("situational_awareness_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("remarks", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", training_status_enum, nullable=False, server_default="DRAFT"),
        sa.Column("submitted_at", sa.DateTime(), nullable=True),
        sa.Column("approved_by", sa.Integer(), nullable=True),
        sa.Column("approved_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["approved_by"],  ["users.id"],   ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["cadet_id"],     ["users.id"],   ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["instructor_id"],["users.id"],   ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["sortie_id"],    ["sorties.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_training_id",           "training_progress", ["id"])
    op.create_index("ix_training_sortie",       "training_progress", ["sortie_id"])
    op.create_index("ix_training_cadet_id",     "training_progress", ["cadet_id"])
    op.create_index("ix_training_status",       "training_progress", ["status"])
    op.create_index("ix_training_cadet_status", "training_progress", ["cadet_id", "status"])

    # ── defects ───────────────────────────────────────────────────────────────
    defect_severity_enum = sa.Enum("LOW", "MEDIUM", "HIGH", "CRITICAL", name="defectseverity")
    defect_status_enum   = sa.Enum("OPEN", "RESOLVED", name="defectstatus")
    op.create_table(
        "defects",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("aircraft_id", sa.Integer(), nullable=False),
        sa.Column("sortie_id",   sa.Integer(), nullable=True),
        sa.Column("reported_by", sa.Integer(), nullable=False),
        sa.Column("severity",    defect_severity_enum, nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status",      defect_status_enum, nullable=False, server_default="OPEN"),
        sa.Column("recovery_decision", sa.Text(), nullable=True),
        sa.Column("created_at",  sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["aircraft_id"], ["aircraft.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reported_by"], ["users.id"],    ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["sortie_id"],   ["sorties.id"],  ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_defects_id",             "defects", ["id"])
    op.create_index("ix_defects_aircraft_id",    "defects", ["aircraft_id"])
    op.create_index("ix_defects_sortie",         "defects", ["sortie_id"])
    op.create_index("ix_defects_reported_by",    "defects", ["reported_by"])
    op.create_index("ix_defects_severity",       "defects", ["severity"])
    op.create_index("ix_defects_status",         "defects", ["status"])
    op.create_index("ix_defects_aircraft_status","defects", ["aircraft_id", "status"])

    # ── audit_logs ────────────────────────────────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("actor_id",    sa.Integer(), nullable=False),
        sa.Column("action",      sa.String(120), nullable=False),
        sa.Column("entity_type", sa.String(80),  nullable=False),
        sa.Column("entity_id",   sa.Integer(), nullable=False),
        sa.Column("old_value",   sa.Text(), nullable=True),
        sa.Column("new_value",   sa.Text(), nullable=True),
        sa.Column("created_at",  sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_id",          "audit_logs", ["id"])
    op.create_index("ix_audit_actor_id",    "audit_logs", ["actor_id"])
    op.create_index("ix_audit_action",      "audit_logs", ["action"])
    op.create_index("ix_audit_entity",      "audit_logs", ["entity_type", "entity_id"])
    op.create_index("ix_audit_actor_action","audit_logs", ["actor_id", "action"])
    op.create_index("ix_audit_created_at",  "audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("defects")
    op.drop_table("training_progress")
    op.drop_table("sorties")
    op.drop_table("aircraft")
    op.drop_table("users")
    op.drop_table("bases")
    # Drop custom enum types (PostgreSQL)
    sa.Enum(name="defectstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="defectseverity").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="trainingstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="sortiestatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="aircraftstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="role").drop(op.get_bind(), checkfirst=True)
