import { useEffect, useState } from "react";
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
import { SysOpManual } from "./components/SysOpManual";
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
  const [manualOpen, setManualOpen] = useState(false);
  const [timeUTC, setTimeUTC] = useState("");
  const [timeLocal, setTimeLocal] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Update clock every second
  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setTimeUTC(now.toISOString().slice(11, 19) + " UTC");
      setTimeLocal(now.toLocaleTimeString([], { hour12: false }) + " LCL");
    };
    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      
      {isAuthenticated && (
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 shadow-lg shadow-black/20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            
            {/* Top Tactical Command Bar */}
            <div className="flex items-center justify-between py-3">
              
              {/* Brand Logo & Telemetry */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-950/40 border border-cyan-800/40 shadow-inner">
                  <svg className="h-5 w-5 text-cyan-400 filter drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm font-black uppercase tracking-widest text-slate-100">
                      Skynet // Console
                    </h1>
                    <span className="pulse-cyan"></span>
                  </div>
                  <p className="text-[10px] font-bold font-mono tracking-widest text-slate-500 uppercase">
                    SYS-OPS // BASE: BLR
                  </p>
                </div>
              </div>

              {/* Real-time Avionics Clocks & Manual */}
              <div className="flex items-center gap-4">
                
                {/* Tactical Clocks */}
                <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] font-bold text-slate-400 bg-slate-950 px-3 py-1.5 rounded border border-slate-800/60">
                  <span className="text-cyan-400 filter drop-shadow-[0_0_4px_rgba(6,182,212,0.4)]">{timeUTC}</span>
                  <span className="text-slate-700">|</span>
                  <span className="text-slate-400">{timeLocal}</span>
                </div>

                {/* 📖 Glowing Sys-Op Manual Button */}
                <button
                  onClick={() => setManualOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded border border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/15 hover:border-amber-400 px-3.5 py-1.5 text-xs font-black text-amber-400 uppercase tracking-widest transition-all shadow-md shadow-amber-950/20 active:scale-95 animate-pulse"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Sys-Op Manual
                </button>

                {/* User State */}
                {user && (
                  <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end">
                      <span className="text-xs font-bold text-slate-200 uppercase">{user.full_name}</span>
                      <RoleBadge role={user.role} size="sm" />
                    </div>
                    <button
                      onClick={handleLogout}
                      className="rounded border border-slate-850 bg-slate-950 hover:bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider transition-colors"
                    >
                      Exit
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Tactical Tab Navigation */}
            <nav className="flex gap-0.5 overflow-x-auto mt-2 -mb-px">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `rounded-t border-t border-x px-4 py-2 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                      isActive
                        ? "border-slate-800 bg-slate-950 text-cyan-400 filter drop-shadow-[0_-2px_4px_rgba(6,182,212,0.15)]"
                        : "border-transparent text-slate-500 hover:text-slate-350 hover:bg-slate-800/20"
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

      {/* Main Command Console Space */}
      <main className={`flex-1 ${isAuthenticated ? "mx-auto w-full max-w-7xl px-4 py-6 md:px-6" : ""}`}>
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

      {/* Embedded Slide-over Operations Manual */}
      <SysOpManual isOpen={manualOpen} onClose={() => setManualOpen(false)} />
      
    </div>
  );
}
