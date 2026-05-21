export function AuditTimeline({ logs }: { logs: any[] }) {
  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold">{log.action}</p>
          <p className="text-xs text-slate-500">{log.entity_type} #{log.entity_id} · Actor #{log.actor_id}</p>
        </div>
      ))}
    </div>
  );
}
