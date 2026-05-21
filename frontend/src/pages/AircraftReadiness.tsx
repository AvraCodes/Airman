import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aircraftApi } from "../api/aircraft";
import { defectsApi } from "../api/defects";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";

export function AircraftReadiness() {
  const { user } = useAuth();
  const role = user?.role;
  const qc = useQueryClient();
  
  const { data: aircraft = [], isLoading } = useQuery({ 
    queryKey: ["aircraft"], 
    queryFn: aircraftApi.list 
  });
  const { data: defects = [] } = useQuery({ 
    queryKey: ["defects"], 
    queryFn: defectsApi.list 
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["aircraft"] });
    qc.invalidateQueries({ queryKey: ["defects"] });
  };

  const mGround = useMutation({ 
    mutationFn: (id: number) => aircraftApi.ground(id), 
    onSuccess: refresh 
  });
  
  const mReady = useMutation({ 
    mutationFn: (id: number) => aircraftApi.ready(id), 
    onSuccess: refresh 
  });
  
  const mDefect = useMutation({ 
    mutationFn: (id: number) => 
      defectsApi.create({ 
        aircraft_id: id, 
        severity: "HIGH" as any, 
        description: "Auto-reported defect from the fleet readiness board" 
      }), 
    onSuccess: refresh 
  });
  
  const mResolve = useMutation({ 
    mutationFn: (id: number) => defectsApi.resolve(id, "Cleared for service after inspection and testing."), 
    onSuccess: refresh 
  });

  const canMaintain = ["MAINTENANCE_OFFICER", "ADMIN"].includes(role || "");

  return (
    <section className="space-y-6 font-sans">
      
      {/* Header Panel */}
      <div className="border-b border-slate-850 pb-4">
        <h2 className="page-title text-2xl font-bold tracking-tight text-slate-100">Aircraft Fleet Readiness</h2>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Monitor aircraft airworthiness, report fleet operational defects, and manage grounding clearances.
        </p>
      </div>

      {isLoading && <p className="text-xs text-slate-500 animate-pulse">Synchronizing fleet parameters...</p>}

      {/* Fleet Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {aircraft.map((a: any) => {
          const related = defects.filter((d: any) => d.aircraft_id === a.id);
          const open = related.filter((d: any) => d.status === "OPEN");
          return (
            <div key={a.id} className="app-card border-slate-800/40 p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-850/60 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{a.aircraft_type}</span>
                    <p className="text-base font-bold text-slate-200 mt-0.5">{a.registration}</p>
                  </div>
                  <StatusBadge value={a.status} />
                </div>
                
                <div className="mt-3.5 space-y-1.5 text-xs text-slate-400 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base Station:</span>
                    <span className="text-slate-350">Station #{a.base_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TBO Remaining:</span>
                    <span className="text-slate-300 font-bold">{a.tbo_remaining_hours} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Logged Defects:</span>
                    <span className={`font-bold ${related.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>{related.length} total</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Related open defects alerts */}
                {!!open.length && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wide">
                      ⚠️ Grounding: {open.length} active defect{open.length > 1 ? "s" : ""}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping"></span>
                  </div>
                )}

                {canMaintain && (
                  <div className="flex gap-2 pt-1">
                    <button className="btn-secondary flex-1 py-2 text-[10px] font-semibold" onClick={() => mDefect.mutate(a.id)}>
                      Log Defect
                    </button>
                    <button className="btn-secondary border-rose-500/20 text-rose-450 hover:bg-rose-950/20 flex-1 py-2 text-[10px] font-semibold" onClick={() => mGround.mutate(a.id)}>
                      Ground
                    </button>
                    <button className="btn-primary flex-1 py-2 text-[10px] font-semibold" onClick={() => mReady.mutate(a.id)}>
                      Clear Ready
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Open Defects Register Card */}
      <div className="app-card border-slate-800/40 p-6 mt-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-850/60 pb-3">
          <span>🔧</span> Open defects register
        </h3>

        <div className="space-y-3">
          {defects.filter((d: any) => d.status === "OPEN").map((d: any) => (
            <div key={d.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-slate-850 bg-slate-950/30 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-250">Defect #{d.id}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">|</span>
                  <span className="text-xs text-slate-400 font-semibold">Aircraft Regist: {d.aircraft_id}</span>
                  <StatusBadge value={d.severity} />
                </div>
                <p className="text-xs text-slate-400 font-medium italic">"{d.description}"</p>
              </div>
              {canMaintain && (
                <button className="btn-primary py-2 px-4 text-[10px] font-semibold self-start sm:self-center" onClick={() => mResolve.mutate(d.id)}>
                  Resolve Issue
                </button>
              )}
            </div>
          ))}
          {!defects.filter((d: any) => d.status === "OPEN").length && (
            <p className="text-xs text-slate-500 py-2">No active defects listed. Hangar reports optimal operation.</p>
          )}
        </div>
      </div>

    </section>
  );
}

