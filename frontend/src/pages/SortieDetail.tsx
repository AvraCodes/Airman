import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { sortiesApi } from "../api/sorties";
import { trainingApi } from "../api/trainingProgress";
import { defectsApi } from "../api/defects";
import { auditApi } from "../api/auditLogs";
import { StatusBadge } from "../components/StatusBadge";


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
    <section className="space-y-6 font-sans">
      
      {/* Title Header */}
      <div className="border-b border-slate-850 pb-4">
        <h2 className="page-title text-2xl font-bold tracking-tight text-slate-100">Sortie Operations Dossier</h2>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Detailed flight parameters, cadet progress metrics, logged hangar defects, and security audit logs.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Core Flight Parameters Card (Left Col, span 2) */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="app-card border-slate-800/40 p-6">
            <div className="flex items-center justify-between border-b border-slate-850/60 pb-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Flight Index Reference</span>
                <p className="text-2xl font-extrabold text-slate-100 mt-0.5 tracking-tight">{sortie.sortie_number}</p>
              </div>
              <StatusBadge value={sortie.status} />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs font-semibold text-slate-400">
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-900/60">
                <span className="text-[9px] uppercase tracking-wider text-slate-500">Cadet Pilot</span>
                <span className="block text-slate-250 mt-1 font-bold">Cadet #{sortie.cadet_id}</span>
              </div>
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-900/60">
                <span className="text-[9px] uppercase tracking-wider text-slate-500">Flight Instructor</span>
                <span className="block text-slate-250 mt-1 font-bold">Instructor #{sortie.instructor_id}</span>
              </div>
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-900/60">
                <span className="text-[9px] uppercase tracking-wider text-slate-500">Aircraft Tail</span>
                <span className="block text-slate-250 mt-1 font-bold">VT-REG-{sortie.aircraft_id}</span>
              </div>
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-900/60">
                <span className="text-[9px] uppercase tracking-wider text-slate-500">Base Station</span>
                <span className="block text-slate-250 mt-1 font-bold">Base-{sortie.base_id}</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-850/40 flex items-center justify-between text-xs">
              <span className="text-slate-500">Assigned Lesson Profile:</span>
              <span className="text-indigo-300 font-bold bg-indigo-500/5 px-3 py-1 rounded-lg border border-indigo-500/10">{sortie.lesson_type}</span>
            </div>
          </div>

          {/* Training Evaluation Performance Card */}
          <div className="app-card border-slate-800/40 p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400"></span>
              Cadet Training Progress Log
            </h3>
            
            {!training.length ? (
              <p className="text-xs text-slate-500 py-2">No active training progress recorded for this flight sortie.</p>
            ) : (
              <div className="space-y-4">
                {training.map((t: any) => (
                  <div key={t.id} className="p-4 rounded-xl border border-slate-850 bg-slate-950/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-250">Record #{t.id}</span>
                        <StatusBadge value={t.status} />
                      </div>
                      <p className="text-xs text-slate-400 mt-2 italic leading-relaxed">
                        "{t.remarks || 'No flight remarks submitted.'}"
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] text-center font-bold bg-slate-950/80 p-2.5 rounded-lg border border-slate-850 min-w-[200px]">
                      <div className="border-r border-slate-800 px-1">
                        <span className="block text-[8px] uppercase tracking-wider text-slate-500">MAN</span>
                        <span className="text-indigo-400 text-xs">{t.maneuver_score}/5</span>
                      </div>
                      <div className="border-r border-slate-800 px-1">
                        <span className="block text-[8px] uppercase tracking-wider text-slate-500">COM</span>
                        <span className="text-indigo-400 text-xs">{t.communication_score}/5</span>
                      </div>
                      <div className="px-1">
                        <span className="block text-[8px] uppercase tracking-wider text-slate-500">SA</span>
                        <span className="text-indigo-400 text-xs">{t.situational_awareness_score}/5</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Hangar Defects Card */}
          <div className="app-card border-slate-800/40 p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse"></span>
              Reported Hangar Defects
            </h3>
            
            {!sortieDefects.length ? (
              <p className="text-xs text-slate-500 py-2">No aircraft defects reported during this sortie's operational span.</p>
            ) : (
              <div className="space-y-3">
                {sortieDefects.map((d: any) => (
                  <div key={d.id} className="p-4 rounded-xl border border-slate-850 bg-slate-950/30 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-250">Defect reference #{d.id}</span>
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                          {d.severity} Priority
                        </span>
                        <StatusBadge value={d.status} />
                      </div>
                      <p className="text-xs text-slate-400 mt-2 font-medium">"{d.description}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Audit Log Timeline (Right Col, span 1) */}
        <div className="md:col-span-1">
          <div className="app-card border-slate-800/40 p-5 h-full">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-850/60 pb-3">
              <span>🛡️</span> Security & Audit trail
            </h3>
            
            {!logs.length ? (
              <p className="text-xs text-slate-500 py-2">No security audit checkpoints logged for this sortie.</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {logs.map((l: any) => (
                  <div key={l.id} className="p-3.5 rounded-xl border border-slate-850/60 bg-slate-950/20 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-400">{l.action.replace(/_/g, " ")}</span>
                      <span className="text-[9px] text-slate-500 font-medium">{new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Operator #{l.actor_id} recorded log transition.</p>
                    {l.notes && (
                      <p className="text-[10px] text-slate-500 leading-relaxed italic bg-slate-950/60 p-2 rounded-lg border border-slate-900/60">
                        "{l.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </section>
  );
}
