import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";

const DEMO_ACCOUNTS = [
  { 
    email: "admin@airman.local",      
    password: "admin",       
    label: "Admin",
    role: "ADMIN",
    clearance: "Root Control // Audits",
    summary: "Full base control & access to global system audit logs."
  },
  { 
    email: "dispatcher@airman.local", 
    password: "dispatcher",  
    label: "Dispatcher",
    role: "DISPATCHER",
    clearance: "Flight Controls",
    summary: "Schedules, releases, and guides flights from Scheduled ➔ Airborne ➔ Landed."
  },
  { 
    email: "instructor@airman.local", 
    password: "instructor",  
    label: "Instructor",
    role: "INSTRUCTOR",
    clearance: "Flight Grading",
    summary: "Reviews assigned sorties and drafts/submits cadet flight training performance grades."
  },
  { 
    email: "cfi@airman.local",        
    password: "cfi",         
    label: "CFI",
    role: "CFI",
    clearance: "Command Approval",
    summary: "Chief Flying Instructor. Reviews, approves or rejects training grades, and officially CLOSES sorties."
  },
  { 
    email: "cadet@airman.local",      
    password: "cadet",       
    label: "Cadet",
    role: "CADET",
    clearance: "Read-Only Pilot",
    summary: "Student pilot. Inspects assigned flight schedules and views officially approved training grades."
  },
  { 
    email: "mo@airman.local",         
    password: "mo",          
    label: "Maint. Officer",
    role: "MAINTENANCE_OFFICER",
    clearance: "Hangar Operations",
    summary: "Aircraft engineer. Tracks active defects, resolves fleet issues, and grounds or readies aircraft."
  },
];

export function Login() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [hoveredPreset, setHoveredPreset] = useState<typeof DEMO_ACCOUNTS[0] | null>(null);

  const performLogin = async (credentials: { email: string; password: string }) => {
    setError(null);
    try {
      await login(credentials);
      navigate(from, { replace: true });
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError(`Network error: Cannot connect to the API server. Please check that the backend is running and CORS is configured.`);
        } else {
          const detail = err.response.data?.detail || err.response.data?.message || err.message;
          if (err.response.status === 401) {
            setError("Invalid email or password. Check the demo accounts below.");
          } else {
            setError(`Server Error (${err.response.status}): ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
          }
        }
      } else {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin({ email, password });
  };

  const fillDemo = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    await performLogin({ email: acc.email, password: acc.password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 select-none font-sans">
      
      {/* Outer Tactical Frame */}
      <div className="w-full max-w-5xl grid md:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Operations Console Login Form (5 cols md) */}
        <div className="md:col-span-5 flex flex-col justify-between app-card border-slate-800/40 p-6 md:p-8 hud-grid industrial-card shadow-2xl">
          <div>
            {/* Top HUD Brand header */}
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-950/30 border border-cyan-900/30 shadow-inner">
                <svg className="h-5 w-5 text-cyan-400 filter drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.4" />
                  <path d="M12 2L2 14h7l3 6 3-6h7L12 2z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 2v10" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                  <path d="M8 12h8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-100 flex items-center gap-1.5 font-display uppercase tracking-widest">
                  SKYNET // GATEWAY
                  <span className="pulse-cyan"></span>
                </h1>
                <p className="text-[9px] font-mono tracking-widest text-slate-500 uppercase font-bold">
                  SECURE FLIGHT PORTAL
                </p>
              </div>
            </div>

            {/* Login Status bar */}
            <div className="mt-5 rounded-xl border border-slate-800/40 bg-slate-900/25 px-4 py-2.5 text-xs text-slate-400 font-sans leading-relaxed">
              Welcome back. Please select an operational preset account or enter your credentials to initiate your secure session.
            </div>

            <h2 className="text-xs font-black text-cyan-400 mt-6 uppercase tracking-widest font-display">
              OPERATOR SIGN IN
            </h2>

            {error && (
              <div className="mt-4 rounded-xl bg-rose-955/20 border border-rose-900/40 px-3.5 py-2.5 text-xs text-rose-450 font-sans leading-relaxed">
                <span className="font-bold block mb-0.5 text-rose-400">Authentication Failed:</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 font-sans">
              <div>
                <label className="block text-[9px] font-bold text-slate-450 mb-1.5 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@airman.local"
                  className="input font-sans text-xs font-bold"
                />
              </div>
              
              <div>
                <label className="block text-[9px] font-bold text-slate-450 mb-1.5 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input font-sans text-xs font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-2.5 uppercase tracking-widest text-xs font-black font-display cursor-pointer"
              >
                {isLoading ? "Validating Session..." : "Initialize Session"}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/40 text-[9px] font-mono tracking-widest text-slate-500 uppercase flex items-center justify-between">
            <span>SECURE SYSTEM</span>
            <span>V1.0.4</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Quick-Presets and Detailed Access Clearance Guide (7 cols md) */}
        <div className="md:col-span-7 flex flex-col justify-between app-card border-slate-800/40 p-6 md:p-8 hud-grid industrial-card shadow-2xl">
          <div>
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-200 flex items-center gap-1.5 font-display">
                  <svg className="h-4.5 w-4.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  STATION ROLES & PRESETS
                </h2>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5 font-bold">
                  Click a card to instantly authenticate and log in
                </p>
              </div>
              <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/20 px-2.5 py-0.5 rounded-full border border-cyan-900/30 tracking-widest">
                PRESETS // BYPASS
              </span>
            </div>

            {/* Presets Grid */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  onMouseEnter={() => setHoveredPreset(acc)}
                  onMouseLeave={() => setHoveredPreset(null)}
                  className="relative flex flex-col justify-between items-start rounded-xl border border-slate-800/60 bg-slate-900/35 p-3 hover:bg-cyan-950/10 hover:border-cyan-500/30 transition-all text-left duration-300 select-none cursor-pointer hover:scale-[1.02] shadow-sm hover:shadow-md"
                >
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-250 tracking-wider font-display uppercase">
                      {acc.label}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  </div>
                  <span className="mt-1 text-[8px] font-mono font-bold text-cyan-400/80 uppercase tracking-widest">
                    [{acc.role.replace(/_/, " ")}]
                  </span>
                </button>
              ))}
            </div>

            {/* Live Hover Info Box / Role Info */}
            <div className="mt-5 rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-4 relative min-h-[95px] flex flex-col justify-center transition-all duration-350">
              <div className="absolute top-0 right-0 px-2 py-0.5 bg-slate-800/40 rounded-bl text-[8px] font-bold text-cyan-300 font-mono uppercase tracking-widest border-l border-b border-cyan-500/10">
                SYS // INFO
              </div>
              
              {hoveredPreset ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest font-display">
                      Clearance: {hoveredPreset.role}
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold">|</span>
                    <span className="text-[9px] text-cyan-300/85 font-mono font-bold uppercase tracking-wider">
                      {hoveredPreset.clearance}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-350 leading-relaxed font-sans font-medium">
                    {hoveredPreset.summary}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="pulse-cyan"></span>
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest font-display">
                      OPERATOR ACCESS PROFILE
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-450 leading-relaxed font-sans font-medium">
                    Hover over any preset role card above to inspect their operational clearance profile and system permissions.
                  </p>
                </div>
              )}
            </div>

            {/* Plain English Guide Panel */}
            <div className="mt-5 rounded-xl border border-cyan-900/10 bg-cyan-950/10 p-4">
              <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 font-display">
                <svg className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                QUICK OPERATIONS GUIDE
              </h3>
              <p className="mt-1.5 text-xs text-slate-350 leading-relaxed font-sans font-medium">
                Skynet oversees a complete flight operations cycle.
                To test the system, simply click **Dispatcher** preset to schedule and launch a flight. Once landed, click **Instructor** to grade the flight performance, and finally **CFI** to approve and close the logs. For technical issues, log in as the **Maintenance Officer** to clear defects!
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/40 flex items-center justify-between text-[9px] font-mono tracking-widest text-slate-500 uppercase">
            <span>BASE STATUS: NOMINAL</span>
            <span>OPERATIONAL LINK SECURED</span>
          </div>
        </div>

      </div>

    </div>
  );
}

