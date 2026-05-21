import { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

export function RoleGuard({ allowed, children }: { allowed: string[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user || !allowed.includes(user.role)) return null;
  return <>{children}</>;
}
