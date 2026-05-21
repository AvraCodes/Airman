import type { Role } from "../types";

const ROLE_STYLES: Record<Role, string> = {
  ADMIN:               "bg-purple-500/10 text-purple-300 border-purple-500/25",
  DISPATCHER:          "bg-indigo-500/10 text-indigo-300 border-indigo-500/25",
  INSTRUCTOR:          "bg-amber-500/10 text-amber-300 border-amber-500/25",
  CFI:                 "bg-violet-500/15 text-violet-300 border-violet-500/25",
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
