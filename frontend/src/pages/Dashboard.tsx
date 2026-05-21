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
      case "TOTAL": return { text: "text-cyan-400", bg: "bg-cyan-500/5", border: "border-cyan-900/30", code: "FLT.01" };
      case "RELEASED": return { text: "text-sky-400", bg: "bg-sky-500/5", border: "border-sky-900/30", code: "FLT.02" };
      case "AIRBORNE": return { text: "text-emerald-400 animate-pulse", bg: "bg-emerald-500/5", border: "border-emerald-900/30", code: "FLT.03" };
      case "LANDED": return { text: "text-teal-400", bg: "bg-teal-500/5", border: "border-teal-900/30", code: "FLT.04" };
      case "GROUNDED": return { text: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-900/30", code: "SYS.GND" };
      case "PENDING": return { text: "text-violet-400", bg: "bg-violet-500/5", border: "border-violet-900/30", code: "SYS.APPR" };
      case "DELAYED": return { text: "text-red-400 animate-pulse", bg: "bg-red-500/5", border: "border-red-900/30", code: "SYS.DLY" };
      default: return { text: "text-slate-400", bg: "bg-slate-500/5", border: "border-slate-900/30", code: "GEN.01" };
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
          title: "🛠️ Admin Override Clearance Active",
          description: "You have complete root access. You are cleared to manage users, inspect the entire base operations, bypass status logic, and view the global paginated Audit logs to track all operations.",
          action: "Move to the Users or Audit list to oversee current station activities."
        };
      case "DISPATCHER":
        return {
          title: "📡 Dispatch Controller clearance Active",
          description: "You are the flight operations dispatcher. You can schedule flights, authorize releases, and monitor airborne status. Remember: you cannot release a sortie if the aircraft is GROUNDED.",
          action: "Go to the Sorties tab to schedule, release, or track active flight sorties."
        };
      case "INSTRUCTOR":
        return {
          title: "👨‍✈️ Flight Instructor clearance Active",
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
          title: "🎓 Cadet Flight Access active",
          description: "Welcome pilot trainee. You have read-only access to view your assigned scheduled flights, check active airborne sorties, and read approved instructor grades.",
          action: "Visit the Sorties page to monitor your flight schedule."
        };
      case "MAINTENANCE_OFFICER":
        return {
          title: "🔧 Maintenance Hangar clearance Active",
          description: "You are the hangar engineer. You hold permissions to inspect reported defects, mark defects as resolved, and declare grounded aircraft READY to return to service.",
          action: "Go to the Aircraft page to inspect the fleet or resolve reported issues."
        };
      default:
        return {
          title: "⚠️ Basic Access active",
          description: "Limited flight clearances. Please log in with a designated operational preset account to gain permissions.",
          action: "Use the presets at the login screen to switch roles."
        };
    }
  };

  const clearance = getRoleClearanceDescription();

  return (
    <div className="space-y-6">
      
      {/* Tactical Status Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border border-slate-800 bg-slate-900/40 p-4 rounded-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 h-[1px] w-24 bg-gradient-to-l from-cyan-400 to-transparent"></div>
        <div>
          <h2 className="page-title">Operations Console Dashboard</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400 text-xs font-mono font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="pulse-cyan"></span>
              SYS.TELEMETRY: ONLINE
            </span>
            <span className="text-slate-700">•</span>
            <span>POLL: 5000MS</span>
            <span className="text-slate-700">•</span>
            <span className="text-amber-500">SECTOR: INDIA-SOUTH</span>
          </div>
        </div>

        {/* Current clearance indicator */}
        <div className="mt-3 md:mt-0 flex items-center gap-2 border border-slate-800 bg-slate-950 px-3 py-1.5 rounded">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">ACTUAL CLEARANCE:</span>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest filter drop-shadow-[0_0_4px_rgba(6,182,212,0.4)]">{role}</span>
        </div>
      </div>

      {/* Operations HUD Panel Grid */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-850 bg-slate-900/20 p-4 h-24 animate-pulse">
              <div className="h-3 w-1/3 rounded bg-slate-800"></div>
              <div className="mt-3 h-8 w-1/2 rounded bg-slate-850"></div>
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
                className={`app-card p-4 transition-all duration-300 hover:scale-[1.01] hover:border-slate-700 hover:shadow-black/50 ${config.bg} ${config.border}`}
              >
                <div className="flex items-center justify-between text-[9px] font-mono font-bold text-slate-500 tracking-wider">
                  <span>METRIC // {config.code}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-800"></span>
                </div>
                <p className="mt-2 text-xs font-black uppercase tracking-wider text-slate-350">{card.title}</p>
                <p className={`mt-1.5 font-mono text-3xl font-black ${config.text}`}>
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
        <div className="md:col-span-2 border border-slate-800 bg-slate-900/30 p-5 rounded-xl backdrop-blur-md relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50"></div>
          
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">
              {clearance.title}
            </h3>
            <span className="text-[9px] font-mono text-cyan-400 font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/30">
              STATUS: DEPLOYED
            </span>
          </div>

          <div className="mt-3 text-xs text-slate-350 font-sans leading-relaxed space-y-2">
            <p>{clearance.description}</p>
            <p className="text-amber-500 font-bold">
              👉 {clearance.action}
            </p>
          </div>
        </div>

        {/* Quick Operations Guide Info Box */}
        <div className="border border-amber-500/20 bg-amber-500/5 p-5 rounded-xl relative flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-500/20 flex items-center justify-center text-[8px] font-bold text-amber-300 font-mono">!</div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">
              💡 Flight Ops Support
            </h3>
            <p className="mt-2 text-xs text-slate-400 font-sans leading-relaxed">
              Need assistance? We have compiled a full list of system rules, role permissions, and operational pathways. Click the pulsing **Sys-Op Manual** button in the header at any time to open the manual.
            </p>
          </div>
          <button
            onClick={() => {
              // Trigger click on the Header manual button
              const btn = document.querySelector("button[class*='amber']") as HTMLButtonElement;
              if (btn) btn.click();
            }}
            className="mt-4 w-full text-center rounded border border-amber-500/40 hover:bg-amber-500/10 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400 transition-colors"
          >
            Launch Manual
          </button>
        </div>

      </div>

    </div>
  );
}
