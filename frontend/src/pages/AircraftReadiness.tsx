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
    <section>
      <h2 className="page-title">Aircraft Readiness</h2>
      {isLoading && <p className="muted mt-3">Loading aircraft fleet...</p>}
      <div className="mt-4 space-y-3">
        {aircraft.map((a: any) => {
          const related = defects.filter((d: any) => d.aircraft_id === a.id);
          const open = related.filter((d: any) => d.status === "OPEN");
          return (
            <div key={a.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{a.registration} · {a.aircraft_type}</p>
                  <p className="muted">Base ID: #{a.base_id} · TBO Remaining: {a.tbo_remaining_hours}h · Defects Logged: {related.length}</p>
                </div>
                <StatusBadge value={a.status} />
              </div>
              {canMaintain && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={() => mDefect.mutate(a.id)}>Report Defect</button>
                  <button className="btn-secondary" onClick={() => mGround.mutate(a.id)}>Ground</button>
                  <button className="btn-primary" onClick={() => mReady.mutate(a.id)}>Mark Ready</button>
                </div>
              )}
              {!!open.length && (
                <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2">
                  <p className="text-sm font-semibold text-rose-700">Open defects: {open.length}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 p-4">
        <p className="font-semibold text-slate-800">Open Defects Register</p>
        <div className="mt-2 space-y-2">
          {defects.filter((d: any) => d.status === "OPEN").map((d: any) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <div className="text-sm">
                <span className="font-semibold">Defect #{d.id}</span> · Aircraft: <span className="font-mono">#{d.aircraft_id}</span> · Severity: <span className="text-rose-600 font-semibold">{d.severity}</span>
                <p className="text-xs text-slate-500 mt-0.5">"{d.description}"</p>
              </div>
              {canMaintain && <button className="btn-primary ml-2" onClick={() => mResolve.mutate(d.id)}>Resolve</button>}
            </div>
          ))}
          {!defects.filter((d: any) => d.status === "OPEN").length && <p className="muted">No open defects.</p>}
        </div>
      </div>
    </section>
  );
}
