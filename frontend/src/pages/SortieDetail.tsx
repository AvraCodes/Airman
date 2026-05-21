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
      <div className="border-b border-slate-300 dark:border-slate-850 pb-4">
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 font-mono">
          SORTIE OPERATIONS DOSSIER // FLT.PARAM
        </h2>
        <p className="text-xs font-semibold text-slate-500 mt-1 font-mono uppercase tracking-wide">
          Detailed flight parameters, cadet progress metrics, logged hangar defects, and security audit logs.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Core Flight Parameters Card (Left Col, span 2) */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="app-card border-slate-300 dark:border-slate-800/40 p-6 bg-white/40 dark:bg-[#0f172a]/20">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850/60 pb-4">
              <div>
                <span className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest font-mono">FLIGHT INDEX REFERENCE //</span>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5 tracking-tight font-mono">{sortie.sortie_number}</p>
              </div>
              <StatusBadge value={sortie.status} />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
              <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-900/60">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500">// CADET PILOT</span>
                <span className="block text-slate-800 dark:text-slate-250 mt-1 font-black">Cadet #{sortie.cadet_id}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-900/60">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500">// INSTRUCTOR</span>
                <span className="block text-slate-800 dark:text-slate-250 mt-1 font-black">Instructor #{sortie.instructor_id}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-900/60">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500">// AIRCRAFT TAIL</span>
                <span className="block text-slate-800 dark:text-slate-250 mt-1 font-black">VT-REG-{sortie.aircraft_id}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-900/60">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500">// BASE STATION</span>
                <span className="block text-slate-800 dark:text-slate-250 mt-1 font-black">Base-{sortie.base_id}</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-850/40 flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-slate-400 dark:text-slate-500">ASSIGNED LESSON PROFILE:</span>
              <span className="text-cyan-600 dark:text-cyan-300 font-black bg-cyan-500/10 dark:bg-cyan-500/5 px-3 py-1 rounded-lg border border-cyan-200 dark:border-cyan-500/10">{sortie.lesson_type}</span>
            </div>
          </div>

          {/* Training Evaluation Performance Card */}
          <div className="app-card border-slate-300 dark:border-slate-800/40 p-6 bg-white/40 dark:bg-[#0f172a]/20">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
              CADET TRAINING PROGRESS LOG
            </h3>
            
            {!training.length ? (
              <p className="text-xs text-slate-500 py-2 font-medium">No active training progress recorded for this flight sortie.</p>
            ) : (
              <div className="space-y-4">
                {training.map((t: any) => (
                  <div key={t.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-250 font-mono">RECORD #{t.id}</span>
                        <StatusBadge value={t.status} />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 italic leading-relaxed font-medium">
                        "{t.remarks || 'No flight remarks submitted.'}"
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] text-center font-bold bg-white dark:bg-slate-950/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 min-w-[200px] font-mono">
                      <div className="border-r border-slate-200 dark:border-slate-800 px-1">
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400 dark:text-slate-500">MAN</span>
                        <span className="text-cyan-600 dark:text-cyan-400 text-xs font-black">{t.maneuver_score}/5</span>
                      </div>
                      <div className="border-r border-slate-200 dark:border-slate-800 px-1">
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400 dark:text-slate-500">COM</span>
                        <span className="text-cyan-600 dark:text-cyan-400 text-xs font-black">{t.communication_score}/5</span>
                      </div>
                      <div className="px-1">
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400 dark:text-slate-500">SA</span>
                        <span className="text-cyan-600 dark:text-cyan-400 text-xs font-black">{t.situational_awareness_score}/5</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Hangar Defects Card */}
          <div className="app-card border-slate-300 dark:border-slate-800/40 p-6 bg-white/40 dark:bg-[#0f172a]/20">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              REPORTED HANGAR DEFECTS
            </h3>
            
            {!sortieDefects.length ? (
              <p className="text-xs text-slate-500 py-2 font-medium">No aircraft defects reported during this sortie's operational span.</p>
            ) : (
              <div className="space-y-3">
                {sortieDefects.map((d: any) => (
                  <div key={d.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap font-mono">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-250">DEFECT REF #{d.id}</span>
                        <span className="text-[9px] uppercase tracking-wider font-black text-rose-600 dark:text-rose-450 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-500/20">
                          {d.severity} PRIORITY
                        </span>
                        <StatusBadge value={d.status} />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">"{d.description}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Audit Log Timeline (Right Col, span 1) */}
        <div className="md:col-span-1">
          <div className="app-card border-slate-300 dark:border-slate-800/40 p-5 h-full bg-white/40 dark:bg-[#0f172a]/20">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-850/60 pb-3 font-mono">
              <svg className="w-4 h-4 text-cyan-500 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              AUDIT // SECURITY
            </h3>
            
            {!logs.length ? (
              <p className="text-xs text-slate-500 py-2 font-medium">No security audit checkpoints logged for this sortie.</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {logs.map((l: any) => (
                  <div key={l.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-850/60 bg-slate-50/50 dark:bg-slate-950/20 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-black text-cyan-600 dark:text-cyan-400 uppercase">{l.action.replace(/_/g, " ")}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">{new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-450 font-mono uppercase font-bold">Operator #{l.actor_id} transitioned state.</p>
                    {l.notes && (
                      <p className="text-[10px] text-slate-600 dark:text-slate-500 leading-relaxed italic bg-white dark:bg-slate-950/60 p-2 rounded-lg border border-slate-200 dark:border-slate-900/60 font-medium">
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
