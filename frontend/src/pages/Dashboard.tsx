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
      case "TOTAL": return { text: "text-indigo-400", bg: "bg-indigo-500/5", border: "border-indigo-950/25" };
      case "RELEASED": return { text: "text-violet-400", bg: "bg-violet-500/5", border: "border-violet-950/25" };
      case "AIRBORNE": return { text: "text-emerald-400 animate-pulse", bg: "bg-emerald-500/5", border: "border-emerald-950/25" };
      case "LANDED": return { text: "text-teal-400", bg: "bg-teal-500/5", border: "border-teal-950/25" };
      case "GROUNDED": return { text: "text-rose-450", bg: "bg-rose-500/5", border: "border-rose-950/25" };
      case "PENDING": return { text: "text-purple-400", bg: "bg-purple-500/5", border: "border-purple-950/25" };
      case "DELAYED": return { text: "text-rose-500 animate-pulse", bg: "bg-rose-500/5", border: "border-rose-950/25" };
      default: return { text: "text-slate-400", bg: "bg-slate-500/5", border: "border-slate-950/25" };
    }
  };

  const cards = [
    { title: "Total Sorties Today", value: sorties.length, type: "TOTAL" },
    { title: "Released Sorties", value: metric("RELEASED"), type: "RELEASED" },
    { title: "Airborne Sorties", value: metric("AIRBORNE"), type: "AIRBORNE" },
    { title: "Landed Sorties", value: metric("LANDED"), type: "LANDED" },
    { title: "Grounded Fleet", value: aircraft.filter((a: any) => a.status === "GROUNDED").length, type: "GROUNDED" },
    { title: "Pending Approvals", value: metric("TRAINING_SUBMITTED"), type: "PENDING" },
    { title: "Delayed Sorties", value: sorties.filter((s: any) => s.delay_minutes > 0).length, type: "DELAYED" },
  ];

  // Easy plain-English role directive explanations for the dashboard footer
  const getRoleClearanceDescription = () => {
    switch (role) {
      case "ADMIN":
        return {
          title: "🛠️ Administrator Clearance Active",
          description: "You have complete root access. You are cleared to manage users, inspect the entire base operations, bypass status logic, and view the global filterable Audit logs to track all operations.",
          action: "Move to the Users or Audit list to oversee current station activities."
        };
      case "DISPATCHER":
        return {
          title: "📡 Dispatch Controller Clearance Active",
          description: "You are the flight operations dispatcher. You can schedule flights, authorize releases, and monitor airborne status. Remember: you cannot release a sortie if the aircraft is GROUNDED.",
          action: "Go to the Sorties tab to schedule, release, or track active flight sorties."
        };
      case "INSTRUCTOR":
        return {
          title: "👨‍✈️ Flight Instructor Clearance Active",
          description: "You are responsible for piloting and mentoring. You can view all sorties, and draft/submit Training Progress reports for landed flights.",
          action: "Go to the Training tab to grade sorties or write comments for completed flights."
        };
      case "CFI":
        return {
          title: "🎖️ Chief Flight Instructor Clearance Active",
          description: "You hold commanding flight authority. You are cleared to review all submitted cadet grades, approve/reject training progress, and officially CLOSE flights to archive them.",
          action: "Go to the Training tab to review, approve, or reject student reports."
        };
      case "CADET":
        return {
          title: "🎓 Cadet Flight Access Active",
          description: "Welcome pilot trainee. You have read-only access to view your assigned scheduled flights, check active airborne sorties, and read approved instructor grades.",
          action: "Visit the Sorties page to monitor your flight schedule."
        };
      case "MAINTENANCE_OFFICER":
        return {
          title: "🔧 Maintenance Hangar Clearance Active",
          description: "You are the hangar engineer. You hold permissions to inspect reported defects, mark defects as resolved, and declare grounded aircraft READY to return to service.",
          action: "Go to the Aircraft page to inspect the fleet or resolve reported issues."
        };
      default:
        return {
          title: "⚠️ Basic Access Active",
          description: "Limited flight clearances. Please log in with a designated operational preset account to gain permissions.",
          action: "Use the presets at the login screen to switch roles."
        };
    }
  };

  const clearance = getRoleClearanceDescription();

  return (
    <div className="space-y-6 font-sans">
      
      {/* Tactical Status Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border border-slate-800/40 bg-slate-900/25 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden">
        <div>
          <h2 className="page-title text-2xl font-bold tracking-tight text-slate-100">Base Operations Hub</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400 text-xs font-medium tracking-wide">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="pulse-cyan"></span>
              Live Telemetry Stream Active
            </span>
            <span className="text-slate-800">•</span>
            <span>Update Poll: 5s</span>
            <span className="text-slate-800">•</span>
            <span className="text-slate-400">Sector: India-South</span>
          </div>
        </div>

        {/* Current clearance indicator */}
        <div className="mt-3 md:mt-0 flex items-center gap-2 border border-slate-850 bg-slate-950/80 px-3.5 py-2 rounded-xl">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Active Profile:</span>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider filter drop-shadow-[0_0_4px_rgba(99,102,241,0.4)]">{role}</span>
        </div>
      </div>

      {/* Operations HUD Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-850 bg-slate-900/10 p-5 h-28 animate-pulse">
              <div className="h-3 w-1/3 rounded bg-slate-800"></div>
              <div className="mt-4 h-8 w-1/2 rounded bg-slate-850"></div>
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
                className={`app-card p-5 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-indigo-950/10 hover:border-slate-800/80 ${config.bg} ${config.border}`}
              >
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 tracking-wide">
                  <span>{card.title}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-800"></span>
                </div>
                <p className={`mt-3 font-semibold text-3xl tracking-tight ${config.text}`}>
                  {String(card.value).padStart(2, "0")}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Operator Directive Clearance & Guide */}
      <div className="grid gap-4 md:grid-cols-3">
        
        {/* Role Clearance Directives Card */}
        <div className="md:col-span-2 app-card border-slate-800/40 p-6 relative">
          
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {clearance.title}
            </h3>
            <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-950/20 px-2.5 py-0.5 rounded-full border border-indigo-900/30">
              Profile Clearance Approved
            </span>
          </div>

          <div className="mt-3.5 text-xs text-slate-350 font-sans leading-relaxed space-y-2.5">
            <p>{clearance.description}</p>
            <p className="text-indigo-400 font-semibold flex items-center gap-1">
              <span>👉</span> {clearance.action}
            </p>
          </div>
        </div>

        {/* Quick Operations Guide Info Box */}
        <div className="app-card border-indigo-500/10 bg-indigo-500/5 p-6 relative flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              💡 Flight Ops Support
            </h3>
            <p className="mt-2 text-xs text-slate-450 font-sans leading-relaxed">
              Need assistance? We have compiled a full list of system rules, role permissions, and operational pathways. Click the **Operations Guide** in the header to launch the manual drawer at any time.
            </p>
          </div>
          <button
            onClick={() => {
              const btn = (document.getElementById("sysop-manual-btn") || document.querySelector("button[class*='indigo']") || document.querySelector("button[class*='amber']")) as HTMLButtonElement;
              if (btn) btn.click();
            }}
            className="mt-4 w-full text-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 py-2.5 text-xs font-semibold text-indigo-300 transition-all active:scale-98"
          >
            Launch Operations Guide
          </button>
        </div>

      </div>

    </div>
  );
}
