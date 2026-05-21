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
        <div className="md:col-span-5 flex flex-col justify-between app-card border-slate-800/40 p-6 md:p-8">
          <div>
            {/* Top HUD Brand header */}
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-950/30 border border-indigo-900/30 shadow-inner">
                <svg className="h-5 w-5 text-indigo-400 filter drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  Skynet Console
                  <span className="pulse-cyan"></span>
                </h1>
                <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">
                  Secure Flight Portal
                </p>
              </div>
            </div>

            {/* Login Status bar */}
            <div className="mt-5 rounded-xl border border-slate-800/40 bg-slate-900/25 px-4 py-2.5 text-xs text-slate-400 font-sans leading-relaxed">
              Welcome back. Please select an operational preset account or enter your credentials to initiate your session.
            </div>

            <h2 className="text-sm font-bold text-slate-200 mt-6 uppercase tracking-wider">
              Operator Sign In
            </h2>

            {error && (
              <div className="mt-4 rounded-xl bg-rose-955/20 border border-rose-900/40 px-3.5 py-2.5 text-xs text-rose-450 font-sans leading-relaxed">
                <span className="font-bold block mb-0.5 text-rose-400">Authentication Failed:</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 font-sans">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@airman.local"
                  className="input font-sans text-xs"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input font-sans text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-2.5 uppercase tracking-wider text-xs font-bold"
              >
                {isLoading ? "Validating Session..." : "Initialize Session"}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/40 text-[10px] text-slate-500 uppercase flex items-center justify-between">
            <span>Secure System</span>
            <span>v1.0.4</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Quick-Presets and Detailed Access Clearance Guide (7 cols md) */}
        <div className="md:col-span-7 flex flex-col justify-between app-card border-slate-800/40 p-6 md:p-8">
          <div>
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  ⚡ Station Roles & Presets
                </h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                  Click a card to instantly authenticate and log in
                </p>
              </div>
              <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-950/20 px-2.5 py-0.5 rounded-full border border-indigo-900/30">
                PRESETS ENABLED
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
                  className="relative flex flex-col justify-between items-start rounded-xl border border-slate-800/60 bg-slate-900/35 p-3 hover:bg-indigo-950/10 hover:border-indigo-500/30 transition-all text-left duration-300 select-none cursor-pointer hover:scale-[1.02] shadow-sm hover:shadow-md"
                >
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-250 tracking-wide">
                      {acc.label}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                  </div>
                  <span className="mt-1 text-[9px] font-medium text-indigo-300/80 uppercase tracking-wider">
                    {acc.clearance}
                  </span>
                </button>
              ))}
            </div>

            {/* Live Hover Info Box / Role Info */}
            <div className="mt-5 rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-4 relative min-h-[90px] flex flex-col justify-center transition-all duration-350">
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-slate-800/40 rounded-bl flex items-center justify-center text-[7px] font-bold text-slate-400 font-mono">ℹ️</div>
              
              {hoveredPreset ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Clearance: {hoveredPreset.role}
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold">|</span>
                    <span className="text-[9px] text-indigo-300/80 font-bold uppercase tracking-wider">
                      {hoveredPreset.clearance}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-350 leading-relaxed font-sans">
                    {hoveredPreset.summary}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="pulse-cyan"></span>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Operator Access Profile
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed font-sans">
                    Hover over any preset role card above to inspect their operational clearance profile and system permissions.
                  </p>
                </div>
              )}
            </div>

            {/* Plain English Guide Panel */}
            <div className="mt-5 rounded-xl border border-indigo-900/10 bg-indigo-950/10 p-4">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>📖</span> Quick Operations Guide
              </h3>
              <p className="mt-1.5 text-xs text-slate-350 leading-relaxed font-sans">
                Skynet oversees a complete flight operations cycle.
                To test the system, simply click **Dispatcher** preset to schedule and launch a flight. Once landed, click **Instructor** to grade the flight performance, and finally **CFI** to approve and close the logs. For technical issues, log in as the **Maintenance Officer** to clear defects!
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-500 uppercase">
            <span>Base Status: Nominal</span>
            <span>Link Secured</span>
          </div>
        </div>

      </div>

    </div>
  );
}

