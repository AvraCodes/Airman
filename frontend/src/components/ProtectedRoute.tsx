import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Role } from "../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If provided, only users with one of these roles (or ADMIN) can access */
  roles?: Role[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user) {
    const allowed = user.role === "ADMIN" || roles.includes(user.role);
    if (!allowed) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-2xl bg-red-50 border border-red-200 p-10 text-center max-w-sm">
            <div className="text-4xl mb-3">🚫</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-sm text-red-600">
              Your role (<strong>{user.role}</strong>) does not have permission to view this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
