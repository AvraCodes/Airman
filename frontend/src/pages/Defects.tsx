import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { defectsApi } from "../api/defects";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";

export function Defects() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data = [] } = useQuery<any[]>({ queryKey: ["defects"], queryFn: () => defectsApi.list() });
  const create = useMutation({
    mutationFn: () => defectsApi.create({ aircraft_id: 1, severity: "HIGH", description: "Hydraulic pressure fluctuation" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["defects"] }),
  });

  return (
    <section className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-850 pb-4">
        <div>
          <h2 className="page-title text-2xl font-bold tracking-tight text-slate-100">Defects Register</h2>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Track, report, and maintain records of aircraft system defects and maintenance advisories.
          </p>
        </div>
        
        <button className="mt-4 sm:mt-0 btn-primary" onClick={() => create.mutate()}>
          Report Defect (Aircraft #1)
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {data.map((d) => (
          <div key={d.id} className="app-card p-5 hover:border-slate-700/60 transition-all hover:shadow-cyan-500/5 hover:-translate-y-0.5 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200 tracking-tight">Defect #{d.id} · <span className="text-rose-400 font-semibold">{d.severity} Severity</span></h3>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Aircraft Reference #1</p>
              </div>
              <StatusBadge value={d.status} />
            </div>
            
            <p className="mt-3.5 text-xs text-slate-400 leading-relaxed font-normal bg-slate-950/40 border border-slate-900/50 rounded-xl p-3">
              {d.description}
            </p>
          </div>
        ))}
        {!data.length && (
          <div className="col-span-full app-card p-10 text-center border border-dashed border-slate-800 bg-transparent">
            <p className="text-xs text-slate-500">No active system defects recorded. System is fully operational.</p>
          </div>
        )}
      </div>
    </section>
  );
}

