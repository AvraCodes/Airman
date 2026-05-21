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
    <section>
      <h2 className="text-xl font-semibold">Defects</h2>
      <button className="mt-3 rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white" onClick={() => create.mutate()}>
        Report Defect (Aircraft #1)
      </button>
      <div className="mt-3 space-y-2">
        {data.map((d) => (
          <div key={d.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Defect #{d.id} · {d.severity}</p>
              <StatusBadge value={d.status} />
            </div>
            <p className="text-sm text-slate-600">{d.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
