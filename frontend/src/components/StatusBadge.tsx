import type { SortieStatus, AircraftStatus, TrainingStatus, DefectStatus, DefectSeverity } from "../types";

// ── Sortie Status ─────────────────────────────────────────────────────────────

const SORTIE_STATUS_STYLES: Record<SortieStatus, string> = {
  SCHEDULED:          "bg-slate-100   text-slate-700",
  RELEASED:           "bg-blue-100    text-blue-700",
  AIRBORNE:           "bg-sky-500     text-white",
  LANDED:             "bg-teal-100    text-teal-700",
  TRAINING_SUBMITTED: "bg-amber-100   text-amber-700",
  TRAINING_APPROVED:  "bg-emerald-100 text-emerald-700",
  CLOSED:             "bg-green-600   text-white",
  CANCELLED:          "bg-red-100     text-red-700",
  AIRCRAFT_GROUNDED:  "bg-orange-100  text-orange-700",
  RECOVERY_REQUIRED:  "bg-red-500     text-white",
};

export function SortieStatusBadge({ status }: { status: SortieStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${SORTIE_STATUS_STYLES[status]}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ── Aircraft Status ───────────────────────────────────────────────────────────

const AIRCRAFT_STATUS_STYLES: Record<AircraftStatus, string> = {
  READY:       "bg-green-100  text-green-700",
  SCHEDULED:   "bg-blue-100   text-blue-700",
  AIRBORNE:    "bg-sky-500    text-white",
  LANDED:      "bg-teal-100   text-teal-700",
  GROUNDED:    "bg-red-100    text-red-700",
  MAINTENANCE: "bg-orange-100 text-orange-700",
};

export function AircraftStatusBadge({ status }: { status: AircraftStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${AIRCRAFT_STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

// ── Training Status ───────────────────────────────────────────────────────────

const TRAINING_STATUS_STYLES: Record<TrainingStatus, string> = {
  DRAFT:     "bg-slate-100   text-slate-600",
  SUBMITTED: "bg-amber-100   text-amber-700",
  APPROVED:  "bg-emerald-100 text-emerald-700",
  REJECTED:  "bg-red-100     text-red-700",
};

export function TrainingStatusBadge({ status }: { status: TrainingStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${TRAINING_STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

// ── Defect Severity ───────────────────────────────────────────────────────────

const DEFECT_SEVERITY_STYLES: Record<DefectSeverity, string> = {
  LOW:      "bg-slate-100  text-slate-600",
  MEDIUM:   "bg-amber-100  text-amber-700",
  HIGH:     "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-500    text-white",
};

export function DefectSeverityBadge({ severity }: { severity: DefectSeverity }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${DEFECT_SEVERITY_STYLES[severity]}`}>
      {severity}
    </span>
  );
}

// ── Defect Status ─────────────────────────────────────────────────────────────

const DEFECT_STATUS_STYLES: Record<DefectStatus, string> = {
  OPEN:     "bg-red-100   text-red-700",
  RESOLVED: "bg-green-100 text-green-700",
};

export function DefectStatusBadge({ status }: { status: DefectStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${DEFECT_STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

export function StatusBadge({ value }: { value: any }) {
  if (value === "READY" || value === "GROUNDED" || value === "MAINTENANCE") {
    return <AircraftStatusBadge status={value} />;
  }
  if (value === "DRAFT" || value === "SUBMITTED" || value === "APPROVED" || value === "REJECTED") {
    return <TrainingStatusBadge status={value} />;
  }
  if (value === "OPEN" || value === "RESOLVED") {
    return <DefectStatusBadge status={value} />;
  }
  if (value === "LOW" || value === "MEDIUM" || value === "HIGH" || value === "CRITICAL") {
    return <DefectSeverityBadge severity={value} />;
  }
  return <SortieStatusBadge status={value} />;
}

