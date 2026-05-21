export function AuditTimeline({ logs }: { logs: any[] }) {
  return (
    <div className="space-y-3 font-sans">
      {logs.map((log) => (
        <div key={log.id} className="rounded-xl border border-slate-850 bg-slate-900/10 p-3.5 border-l-2 border-l-cyan-500/40 hover:border-l-cyan-500 transition-all duration-200">
          <p className="text-xs font-bold text-slate-200 uppercase tracking-wide">{log.action.replace(/_/g, " ")}</p>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">
            Entity: {log.entity_type} #{log.entity_id} · Operator Clearance #{log.actor_id}
          </p>
          {log.notes && (
            <p className="text-[10px] text-slate-450 mt-1.5 italic bg-slate-950/40 p-2 rounded-lg border border-slate-850/30">
              "{log.notes}"
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
