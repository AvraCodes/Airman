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
  const [theme, setTheme] = useState(() => localStorage.getItem("airman-theme") || "dark");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Persist theme and update HTML class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("airman-theme", theme);
  }, [theme]);

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
    <div className="min-h-screen bg-transparent flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      
      {isAuthenticated && (
        <header className="border-b border-slate-850 bg-slate-900/30 backdrop-blur-md sticky top-0 z-40 shadow-sm shadow-black/10 transition-all duration-300">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            
            {/* Top Tactical Command Bar */}
            <div className="flex items-center justify-between py-4">
              
              {/* Brand Logo & Telemetry */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-950/30 border border-cyan-900/30 shadow-inner">
                  <svg className="h-5 w-5 text-cyan-400 filter drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm font-black uppercase tracking-widest text-slate-100 font-display">
                      SKYNET // FLT.OPS
                    </h1>
                    <span className="pulse-cyan"></span>
                  </div>
                  <p className="text-[9px] font-mono tracking-widest text-cyan-500 uppercase font-bold">
                    SEC.03 // SYSTEM: ACTIVE
                  </p>
                </div>
              </div>
 
              {/* Real-time Avionics Clocks, Theme & Manual */}
              <div className="flex items-center gap-4">
                
                {/* Tactical Clocks */}
                <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] font-semibold text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-850 transition-all duration-300">
                  <span className="text-cyan-400 filter drop-shadow-[0_0_4px_rgba(6,182,212,0.4)]">{timeUTC}</span>
                  <span className="text-slate-500 dark:text-slate-800 opacity-60">|</span>
                  <span className="text-slate-400">{timeLocal}</span>
                </div>

                {/* 🌗 Elegant Theme Toggle Button */}
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-900/60 p-2 text-slate-400 hover:text-slate-200 transition-all duration-300 active:scale-95 cursor-pointer"
                  title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {theme === "dark" ? (
                    <svg className="h-4 w-4 text-amber-400 filter drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </button>
 
                {/* 📖 Glowing Sys-Op Manual Button */}
                <button
                  id="sysop-manual-btn"
                  onClick={() => setManualOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 hover:border-cyan-400/50 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 transition-all shadow-md shadow-cyan-950/20 hover:scale-[1.02] duration-250 active:scale-95"
                >
                  <svg className="h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Operations Guide
                </button>
 
                {/* User State */}
                {user && (
                  <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end">
                      <span className="text-xs font-semibold text-slate-200">{user.full_name}</span>
                      <RoleBadge role={user.role} size="sm" />
                    </div>
                    <button
                      onClick={handleLogout}
                      className="rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-900 px-3 py-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-250 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
 
            </div>


            {/* Tactical Tab Navigation */}
            <nav className="flex gap-6 overflow-x-auto -mb-px">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `pb-3 pt-1 text-xs font-semibold tracking-wide whitespace-nowrap transition-all border-b-2 ${
                      isActive
                        ? "border-cyan-500 text-cyan-400 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-300"
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
      
      {/* 🌗 Floating Universal Theme Toggle on Login Screen */}
      {!isAuthenticated && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-900/60 p-2 text-slate-400 hover:text-slate-200 transition-all duration-300 active:scale-95 cursor-pointer shadow-lg dark:border-slate-800 dark:bg-slate-950/80 light:border-slate-200 light:bg-white"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <svg className="h-4.5 w-4.5 text-amber-400 filter drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ) : (
              <svg className="h-4.5 w-4.5 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      )}
      
    </div>
  );
}
