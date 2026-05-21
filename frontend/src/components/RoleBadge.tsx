import type { Role } from "../types";

const ROLE_STYLES: Record<Role, string> = {
  ADMIN:               "bg-sky-500/10 text-sky-300 border-sky-500/25",
  DISPATCHER:          "bg-blue-500/10 text-blue-300 border-blue-500/25",
  INSTRUCTOR:          "bg-amber-500/10 text-amber-300 border-amber-500/25",
  CFI:                 "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
  CADET:               "bg-teal-500/10 text-teal-350 border-teal-500/25",
  MAINTENANCE_OFFICER: "bg-rose-500/10 text-rose-350 border-rose-500/25",
};

const ROLE_LABELS: Record<Role, string> = {
  ADMIN:               "Admin",
  DISPATCHER:          "Dispatcher",
  INSTRUCTOR:          "Instructor",
  CFI:                 "CFI",
  CADET:               "Cadet",
  MAINTENANCE_OFFICER: "Maint. Officer",
};

interface RoleBadgeProps {
  role: Role;
  size?: "sm" | "md";
}

export function RoleBadge({ role, size = "md" }: RoleBadgeProps) {
  const base = "inline-flex items-center rounded-full border font-medium";
  const sz = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span className={`${base} ${sz} ${ROLE_STYLES[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}
