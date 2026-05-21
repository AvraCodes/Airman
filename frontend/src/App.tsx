import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { AircraftReadiness } from "./pages/AircraftReadiness";
import { AuditLogs } from "./pages/AuditLogs";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { SortieBoard } from "./pages/SortieBoard";
import { SortieDetail } from "./pages/SortieDetail";
import { TrainingProgress } from "./pages/TrainingProgress";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleBadge } from "./components/RoleBadge";
import { useAuth } from "./hooks/useAuth";

const NAV = [
  { to: "/",        label: "Dashboard" },
  { to: "/sorties", label: "Sorties" },
  { to: "/training", label: "Training" },
  { to: "/aircraft", label: "Aircraft" },
  { to: "/audit",   label: "Audit",    roles: ["ADMIN", "DISPATCHER"] as const },
];

export default function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {isAuthenticated && (
        <header className="bg-gradient-to-r from-sky-900 via-sky-800 to-cyan-800 shadow-lg">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            {/* Top bar */}
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 shadow">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white leading-tight">Skynet</h1>
                  <p className="text-xs text-sky-300 leading-tight">Flight Operations</p>
                </div>
              </div>
              {user && (
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-medium text-white">{user.full_name}</span>
                    <RoleBadge role={user.role} size="sm" />
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-sm text-white transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex gap-1 pb-3 overflow-x-auto">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-white text-sky-900 shadow-sm"
                        : "text-sky-100 hover:bg-white/10"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>
      )}

      <main className={isAuthenticated ? "mx-auto max-w-7xl px-4 py-6 md:px-6" : ""}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/sorties" element={<ProtectedRoute><SortieBoard /></ProtectedRoute>} />
          <Route path="/sorties/:id" element={<ProtectedRoute><SortieDetail /></ProtectedRoute>} />
          <Route path="/training" element={<ProtectedRoute><TrainingProgress /></ProtectedRoute>} />
          <Route path="/aircraft" element={<ProtectedRoute><AircraftReadiness /></ProtectedRoute>} />
          <Route
            path="/audit"
            element={
              <ProtectedRoute roles={["ADMIN", "DISPATCHER"]}>
                <AuditLogs />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
