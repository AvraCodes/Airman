import type { SortieStatus, AircraftStatus, TrainingStatus, DefectStatus, DefectSeverity } from "../types";

// ── Sortie Status ─────────────────────────────────────────────────────────────

const SORTIE_STATUS_STYLES: Record<SortieStatus, string> = {
  SCHEDULED:          "bg-slate-500/10    text-slate-350    border border-slate-700/30",
  RELEASED:           "bg-indigo-500/10   text-indigo-300   border border-indigo-500/25",
  AIRBORNE:           "bg-emerald-500/20  text-emerald-300  border border-emerald-500/30 shadow-sm shadow-emerald-500/10 animate-pulse",
  LANDED:             "bg-teal-500/15     text-teal-300     border border-teal-500/25",
  TRAINING_SUBMITTED: "bg-amber-500/10    text-amber-300    border border-amber-500/25",
  TRAINING_APPROVED:  "bg-violet-500/15    text-violet-300   border border-violet-500/25",
  CLOSED:             "bg-slate-800/80    text-slate-400    border border-slate-700/40",
  CANCELLED:          "bg-rose-500/10     text-rose-300     border border-rose-500/20",
  AIRCRAFT_GROUNDED:  "bg-rose-500/15     text-rose-450     border border-rose-500/25",
  RECOVERY_REQUIRED:  "bg-rose-500/20     text-rose-300     border border-rose-500/30",
};

export function SortieStatusBadge({ status }: { status: SortieStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${SORTIE_STATUS_STYLES[status]}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ── Aircraft Status ───────────────────────────────────────────────────────────

const AIRCRAFT_STATUS_STYLES: Record<AircraftStatus, string> = {
  READY:       "bg-emerald-500/15   text-emerald-350  border border-emerald-500/25",
  SCHEDULED:   "bg-indigo-500/10    text-indigo-300   border border-indigo-500/20",
  AIRBORNE:    "bg-indigo-500/20    text-indigo-300   border border-indigo-500/30",
  LANDED:      "bg-teal-500/15      text-teal-300     border border-teal-500/25",
  GROUNDED:    "bg-rose-500/15      text-rose-400     border border-rose-500/25",
  MAINTENANCE: "bg-amber-500/10     text-amber-300    border border-amber-500/20",
};

export function AircraftStatusBadge({ status }: { status: AircraftStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${AIRCRAFT_STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

// ── Training Status ───────────────────────────────────────────────────────────

const TRAINING_STATUS_STYLES: Record<TrainingStatus, string> = {
  DRAFT:     "bg-slate-500/10    text-slate-350    border border-slate-700/30",
  SUBMITTED: "bg-amber-500/10    text-amber-300    border border-amber-500/20",
  APPROVED:  "bg-emerald-500/15   text-emerald-350  border border-emerald-500/25",
  REJECTED:  "bg-rose-500/15      text-rose-450     border border-rose-500/25",
};

export function TrainingStatusBadge({ status }: { status: TrainingStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${TRAINING_STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

// ── Defect Severity ───────────────────────────────────────────────────────────

const DEFECT_SEVERITY_STYLES: Record<DefectSeverity, string> = {
  LOW:      "bg-slate-500/10    text-slate-350    border border-slate-700/30",
  MEDIUM:   "bg-amber-500/10    text-amber-350    border border-amber-500/20",
  HIGH:     "bg-orange-500/15   text-orange-350   border border-orange-500/25",
  CRITICAL: "bg-rose-500/20     text-rose-300     border border-rose-500/30",
};

export function DefectSeverityBadge({ severity }: { severity: DefectSeverity }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${DEFECT_SEVERITY_STYLES[severity]}`}>
      {severity}
    </span>
  );
}

// ── Defect Status ─────────────────────────────────────────────────────────────

const DEFECT_STATUS_STYLES: Record<DefectStatus, string> = {
  OPEN:     "bg-rose-500/15      text-rose-400     border border-rose-500/25",
  RESOLVED: "bg-emerald-500/15   text-emerald-350  border border-emerald-500/25",
};

export function DefectStatusBadge({ status }: { status: DefectStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${DEFECT_STATUS_STYLES[status]}`}>
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

