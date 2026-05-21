import type { Role } from "../types";

const ROLE_STYLES: Record<Role, string> = {
  ADMIN:               "bg-purple-100 text-purple-800 border-purple-200",
  DISPATCHER:          "bg-blue-100   text-blue-800   border-blue-200",
  INSTRUCTOR:          "bg-amber-100  text-amber-800  border-amber-200",
  CFI:                 "bg-emerald-100 text-emerald-800 border-emerald-200",
  CADET:               "bg-sky-100    text-sky-800    border-sky-200",
  MAINTENANCE_OFFICER: "bg-orange-100 text-orange-800 border-orange-200",
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
