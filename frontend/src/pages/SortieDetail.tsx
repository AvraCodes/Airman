import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { sortiesApi } from "../api/sorties";
import { trainingApi } from "../api/trainingProgress";
import { defectsApi } from "../api/defects";
import { auditApi } from "../api/auditLogs";

export function SortieDetail() {
  const { id } = useParams();
  const sortieId = Number(id || 1);

  const { data: sortie } = useQuery({ 
    queryKey: ["sortie", sortieId], 
    queryFn: () => sortiesApi.get(sortieId) 
  });
  const { data: training = [] } = useQuery({ 
    queryKey: ["sortie-training", sortieId], 
    queryFn: () => trainingApi.getBySortie(sortieId) 
  });
  const { data: defects = [] } = useQuery({ 
    queryKey: ["defects"], 
    queryFn: defectsApi.list 
  });
  const { data: logs = [] } = useQuery({ 
    queryKey: ["audit-logs", sortieId], 
    queryFn: () => auditApi.list({ entity_type: "sortie", entity_id: sortieId }) 
  });

  const sortieDefects = defects.filter((d: any) => d.sortie_id === sortieId);

  if (!sortie) return <p className="muted p-4">Loading sortie details...</p>;

  return (
    <section>
      <h2 className="page-title">Sortie Detail</h2>
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-lg font-semibold text-slate-900">{sortie.sortie_number}</p>
        <p className="text-sm text-slate-600 mt-1">Lesson: {sortie.lesson_type} · Status: {sortie.status}</p>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
          <div>Cadet ID: <span className="font-mono text-slate-800">#{sortie.cadet_id}</span></div>
          <div>Instructor ID: <span className="font-mono text-slate-800">#{sortie.instructor_id}</span></div>
          <div>Aircraft ID: <span className="font-mono text-slate-800">#{sortie.aircraft_id}</span></div>
          <div>Base ID: <span className="font-mono text-slate-800">#{sortie.base_id}</span></div>
        </div>
      </div>
      
      <div className="mt-4 rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-2">Training Progress Status</h3>
        {!training.length ? (
          <p className="text-sm text-slate-500">No training progress recorded.</p>
        ) : (
          training.map((t: any) => (
            <div key={t.id} className="text-sm py-1 border-b border-slate-100 last:border-0">
              <span className="font-mono">#{t.id}</span> · Status: <span className="font-semibold">{t.status}</span> · Remarks: <span className="text-slate-600 italic">"{t.remarks || 'None'}"</span>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-2">Linked Defects</h3>
        {!sortieDefects.length ? (
          <p className="text-sm text-slate-500">No defects linked to this sortie.</p>
        ) : (
          sortieDefects.map((d: any) => (
            <div key={d.id} className="text-sm py-1 border-b border-slate-100 last:border-0">
              <span className="font-mono">#{d.id}</span> · Severity: <span className="font-semibold text-rose-600">{d.severity}</span> · Status: <span className="font-semibold">{d.status}</span> · Description: <span className="text-slate-600">"{d.description}"</span>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-2">Sortie Audit Log</h3>
        {!logs.length ? (
          <p className="text-sm text-slate-500">No audit events recorded for this sortie.</p>
        ) : (
          logs.map((l: any) => (
            <div key={l.id} className="text-sm py-1 border-b border-slate-100 last:border-0 flex justify-between">
              <span className="text-slate-700">{l.action} · <span className="text-xs text-slate-400 font-mono">{l.notes}</span></span>
              <span className="text-xs text-slate-400 font-mono">{new Date(l.created_at).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
