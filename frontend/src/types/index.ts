// ─────────────────────────────────────────────────────────────────────────────
// Skynet — Shared TypeScript types
// ─────────────────────────────────────────────────────────────────────────────

// ── Enums ─────────────────────────────────────────────────────────────────────

export type Role =
  | "ADMIN"
  | "DISPATCHER"
  | "INSTRUCTOR"
  | "CFI"
  | "CADET"
  | "MAINTENANCE_OFFICER";

export type AircraftStatus =
  | "READY"
  | "SCHEDULED"
  | "AIRBORNE"
  | "LANDED"
  | "GROUNDED"
  | "MAINTENANCE";

export type SortieStatus =
  | "SCHEDULED"
  | "RELEASED"
  | "AIRBORNE"
  | "LANDED"
  | "TRAINING_SUBMITTED"
  | "TRAINING_APPROVED"
  | "CLOSED"
  | "CANCELLED"
  | "AIRCRAFT_GROUNDED"
  | "RECOVERY_REQUIRED";

export type TrainingStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
export type DefectSeverity  = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type DefectStatus    = "OPEN" | "RESOLVED";

// ── Models ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  base_id: number | null;
  created_at: string;
}

export interface Aircraft {
  id: number;
  registration: string;
  aircraft_type: string;
  base_id: number;
  status: AircraftStatus;
  tbo_remaining_hours: number;
  created_at: string;
}

export interface Sortie {
  id: number;
  sortie_number: string;
  cadet_id: number;
  instructor_id: number;
  aircraft_id: number;
  base_id: number;
  lesson_type: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: SortieStatus;
  delay_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface TrainingProgress {
  id: number;
  sortie_id: number;
  cadet_id: number;
  instructor_id: number;
  lesson_type: string;
  maneuver_score: number;
  communication_score: number;
  situational_awareness_score: number;
  remarks: string;
  status: TrainingStatus;
  submitted_at: string | null;
  approved_by: number | null;
  approved_at: string | null;
}

export interface Defect {
  id: number;
  aircraft_id: number;
  sortie_id: number | null;
  reported_by: number;
  severity: DefectSeverity;
  description: string;
  status: DefectStatus;
  recovery_decision: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ── Payload types (for mutations) ─────────────────────────────────────────────

export interface SortieCreate {
  sortie_number: string;
  cadet_id: number;
  instructor_id: number;
  aircraft_id: number;
  base_id: number;
  lesson_type: string;
  scheduled_start: string;
  scheduled_end: string;
  delay_minutes?: number;
}

export interface TrainingProgressCreate {
  sortie_id: number;
  cadet_id: number;
  instructor_id: number;
  lesson_type: string;
  maneuver_score?: number;
  communication_score?: number;
  situational_awareness_score?: number;
  remarks?: string;
}

export interface DefectCreate {
  aircraft_id: number;
  sortie_id?: number | null;
  severity: DefectSeverity;
  description: string;
}
