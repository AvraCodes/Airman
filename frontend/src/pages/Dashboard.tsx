import { useQuery } from "@tanstack/react-query";
import { aircraftApi } from "../api/aircraft";
import { sortiesApi } from "../api/sorties";
import { useAuth } from "../hooks/useAuth";

export function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || "UNKNOWN";
  
  const { data: sorties = [], isLoading: loadingSorties } = useQuery({ 
    queryKey: ["dash-sorties"], 
    queryFn: sortiesApi.list,
    refetchInterval: 5000, // Live status updates every 5 seconds
  });
  
  const { data: aircraft = [], isLoading: loadingAircraft } = useQuery({ 
    queryKey: ["dash-aircraft"], 
    queryFn: aircraftApi.list,
    refetchInterval: 5000, // Live updates every 5 seconds
  });

  const isLoading = loadingSorties || loadingAircraft;
  const metric = (status: string) => sorties.filter((s: any) => s.status === status).length;

  // Custom styling for each operational gauge
  const getMetricStyle = (key: string) => {
    switch (key) {
      case "TOTAL": return { text: "text-sky-500 dark:text-sky-400", bg: "bg-sky-500/5", border: "border-sky-200 dark:border-sky-950/25" };
      case "RELEASED": return { text: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-500/5", border: "border-cyan-200 dark:border-cyan-950/25" };
      case "AIRBORNE": return { text: "text-emerald-600 dark:text-emerald-400 animate-pulse", bg: "bg-emerald-500/5", border: "border-emerald-200 dark:border-emerald-950/25" };
      case "LANDED": return { text: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/5", border: "border-teal-200 dark:border-teal-950/25" };
      case "GROUNDED": return { text: "text-rose-600 dark:text-rose-450", bg: "bg-rose-500/5", border: "border-rose-200 dark:border-rose-950/25" };
      case "PENDING": return { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/5", border: "border-blue-200 dark:border-blue-950/25" };
      case "DELAYED": return { text: "text-rose-600 dark:text-rose-500 animate-pulse", bg: "bg-rose-500/5", border: "border-rose-200 dark:border-rose-950/25" };
      default: return { text: "text-slate-600 dark:text-slate-400", bg: "bg-slate-500/5", border: "border-slate-200 dark:border-slate-950/25" };
    }
  };

  const cards = [
    { title: "TOTAL SORTIES TODAY", value: sorties.length, type: "TOTAL", telemetry: "FLT.PLAN: SCHED", code: "RWY.09" },
    { title: "RELEASED SORTIES", value: metric("RELEASED"), type: "RELEASED", telemetry: "TAXI.AUTH: CLEAR", code: "DEP.CON" },
    { title: "AIRBORNE SORTIES", value: metric("AIRBORNE"), type: "AIRBORNE", telemetry: "ALT: FL240 // SPD: M.74", code: "CTR.ZONE" },
    { title: "LANDED SORTIES", value: metric("LANDED"), type: "LANDED", telemetry: "APRON: PARKED", code: "OPS.COMP" },
    { title: "GROUNDED FLEET", value: aircraft.filter((a: any) => a.status === "GROUNDED").length, type: "GROUNDED", telemetry: "SYS.STATUS: AOG", code: "HGR.03" },
    { title: "PENDING APPROVALS", value: metric("TRAINING_SUBMITTED"), type: "PENDING", telemetry: "EVAL.REQ: CHIEF", code: "SIGN.OFF" },
    { title: "DELAYED SORTIES", value: sorties.filter((s: any) => s.delay_minutes > 0).length, type: "DELAYED", telemetry: "ATC.HOLD: WX.DLY", code: "SEQ.WAIT" },
  ];

  // Easy plain-English role directive explanations for the dashboard footer (no emojis)
  const getRoleClearanceDescription = () => {
    switch (role) {
      case "ADMIN":
        return {
          title: "[ SEC-5 ] ADMINISTRATOR SYSTEM CONTROL",
          description: "You have complete root access. You are cleared to manage users, inspect the entire base operations, bypass status logic, and view the global filterable Audit logs to track all operations.",
          action: "Move to the Users or Audit list to oversee current station activities."
        };
      case "DISPATCHER":
        return {
          title: "[ SEC-4 ] FLIGHT DISPATCH OPERATIONS",
          description: "You are the flight operations dispatcher. You can schedule flights, authorize releases, and monitor airborne status. Remember: you cannot release a sortie if the aircraft is GROUNDED.",
          action: "Go to the Sorties tab to schedule, release, or track active flight sorties."
        };
      case "INSTRUCTOR":
        return {
          title: "[ SEC-3 ] FLIGHT INSTRUCTOR CONTROL",
          description: "You are responsible for piloting and mentoring. You can view all sorties, and draft/submit Training Progress reports for landed flights.",
          action: "Go to the Training tab to grade sorties or write comments for completed flights."
        };
      case "CFI":
        return {
          title: "[ SEC-4 ] CHIEF INSTRUCTOR AUTHORITY",
          description: "You hold commanding flight authority. You are cleared to review all submitted cadet grades, approve/reject training progress, and officially CLOSE flights to archive them.",
          action: "Go to the Training tab to review, approve, or reject student reports."
        };
      case "CADET":
        return {
          title: "[ SEC-1 ] CADET FLIGHT OPERATIONS",
          description: "Welcome pilot trainee. You have read-only access to view your assigned scheduled flights, check active airborne sorties, and read approved instructor grades.",
          action: "Visit the Sorties page to monitor your flight schedule."
        };
      case "MAINTENANCE_OFFICER":
        return {
          title: "[ SEC-2 ] HANGAR MAINTENANCE ENGINEER",
          description: "You are the hangar engineer. You hold permissions to inspect reported defects, mark defects as resolved, and declare grounded aircraft READY to return to service.",
          action: "Go to the Aircraft page to inspect the fleet or resolve reported issues."
        };
      default:
        return {
          title: "[ SEC-0 ] GENERAL ACCESS CONTROL",
          description: "Limited flight clearances. Please log in with a designated operational preset account to gain permissions.",
          action: "Use the presets at the login screen to switch roles."
        };
    }
  };

  const clearance = getRoleClearanceDescription();

  return (
    <div className="space-y-6 font-sans">
      
      {/* Tactical Status Panel */}
      <div className="hud-grid flex flex-col md:flex-row md:items-center md:justify-between border border-slate-300 dark:border-slate-800/40 bg-slate-100/50 dark:bg-slate-900/25 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden">
        {/* Decorative tactical radar vector backdrops */}
        <div className="absolute right-0 top-0 w-32 h-full opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <svg className="w-full h-full text-cyan-400" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" />
            <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="1" />
            <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        <div className="relative z-10">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 font-mono">
            BASE OPERATIONS // FLT.HUD
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 dark:text-slate-400 text-xs font-semibold tracking-wide font-mono">
            <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
              <span className="pulse-cyan"></span>
              LIVE TELEMETRY STREAM
            </span>
            <span className="text-slate-300 dark:text-slate-800">/</span>
            <span>POLL: 5.0S</span>
            <span className="text-slate-300 dark:text-slate-800">/</span>
            <span>SEC.ZONE: INDIA-SOUTH</span>
          </div>
        </div>

        {/* Current clearance indicator */}
        <div className="mt-3 md:mt-0 flex items-center gap-2 border border-slate-300 dark:border-slate-850 bg-white dark:bg-slate-950/80 px-3.5 py-2 rounded-xl relative z-10 shadow-sm dark:shadow-none">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">OPERATOR_ID //</span>
          <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-wider font-mono">
            {role}
          </span>
        </div>
      </div>

      {/* Operations HUD Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-slate-100/30 dark:bg-slate-900/10 p-5 h-28 animate-pulse">
              <div className="h-3 w-1/3 rounded bg-slate-300 dark:bg-slate-800"></div>
              <div className="mt-4 h-8 w-1/2 rounded bg-slate-200 dark:bg-slate-850"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const config = getMetricStyle(card.type);
            return (
              <div 
                key={card.title} 
                className={`app-card hud-grid industrial-card p-5 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-cyan-950/10 hover:border-cyan-500/50 ${config.bg} ${config.border}`}
              >
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wider font-mono">
                  <span>{card.title}</span>
                  <div className="flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-800"></span>
                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-850"></span>
                  </div>
                </div>
                
                <p className={`mt-3 font-black text-4xl font-mono tracking-tighter ${config.text}`}>
                  {String(card.value).padStart(2, "0")}
                </p>

                {/* Tactical Telemetry readout at the bottom of each metric gauge */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800/30 pt-2 font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  <span>{card.telemetry}</span>
                  <span className="text-slate-300 dark:text-slate-800">//</span>
                  <span>{card.code}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Operator Directive Clearance & Guide */}
      <div className="grid gap-4 md:grid-cols-3">
        
        {/* Role Clearance Directives Card */}
        <div className="md:col-span-2 app-card border-slate-300 dark:border-slate-800/40 p-6 relative bg-white/40 dark:bg-[#0f172a]/20">
          {/* Subtle tactical decorative corners */}
          <div className="absolute top-0 right-0 w-8 h-8 opacity-[0.08] pointer-events-none">
            <svg className="w-full h-full text-cyan-500" viewBox="0 0 20 20" fill="none">
              <path d="M0 1h19v19" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>

          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/40 pb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 font-mono flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {clearance.title}
            </h3>
            <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-950/20 px-2.5 py-0.5 rounded-full border border-cyan-250 dark:border-cyan-900/30 font-mono uppercase tracking-wider">
              CLEARANCE: SECURE
            </span>
          </div>

          <div className="mt-4 text-xs text-slate-600 dark:text-slate-350 font-sans leading-relaxed space-y-3">
            <p className="font-medium">{clearance.description}</p>
            <div className="flex items-start gap-2 border-t border-slate-200 dark:border-slate-800/20 pt-3 text-cyan-600 dark:text-cyan-400 font-mono font-bold text-[11px] uppercase tracking-wider">
              <svg className="w-3 h-3 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
              <span>ACTION DIRECTIVE // {clearance.action}</span>
            </div>
          </div>
        </div>

        {/* Quick Operations Guide Info Box */}
        <div className="app-card border-cyan-200 dark:border-cyan-500/10 bg-cyan-50/40 dark:bg-cyan-500/5 p-6 relative flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-8 h-8 opacity-[0.08] pointer-events-none">
            <svg className="w-full h-full text-cyan-500" viewBox="0 0 20 20" fill="none">
              <path d="M0 1h19v19" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-mono flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              SYS.GUIDE // SUPPORT
            </h3>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-450 leading-relaxed font-medium">
              Need operational assistance? We have compiled a detailed, structural list of system rules, role permissions, and flight lifecycle pathways. Trigger the interactive manual drawer in the navigation bar or control deck at any time.
            </p>
          </div>
          <button
            onClick={() => {
              const btn = (document.getElementById("sysop-manual-btn") || document.querySelector("button[class*='cyan']") || document.querySelector("button[class*='amber']")) as HTMLButtonElement;
              if (btn) btn.click();
            }}
            className="mt-4 w-full text-center rounded-xl border border-cyan-300 dark:border-cyan-500/30 bg-cyan-500/10 dark:bg-cyan-500/10 hover:bg-cyan-500/20 py-2.5 text-xs font-black text-cyan-600 dark:text-cyan-300 transition-all active:scale-98 font-mono uppercase tracking-widest"
          >
            SYS.MANUAL // EXECUTE
          </button>
        </div>

      </div>

    </div>
  );
}

