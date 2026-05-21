import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { auditApi } from "../api/auditLogs";

export function AuditLogs() {
  const { data = [] } = useQuery<any[]>({ queryKey: ["audit"], queryFn: () => auditApi.list() });
  const [entity, setEntity] = useState("ALL");
  const [action, setAction] = useState("ALL");

  const rows = useMemo(
    () => data.filter((r) => (entity === "ALL" ? true : r.entity_type === entity)).filter((r) => (action === "ALL" ? true : r.action === action)),
    [data, entity, action],
  );

  const entities = ["ALL", ...Array.from(new Set(data.map((d) => String(d.entity_type))))];
  const actions = ["ALL", ...Array.from(new Set(data.map((d) => String(d.action))))];

  return (
    <section className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-850 pb-4">
        <div>
          <h2 className="page-title text-2xl font-bold tracking-tight text-slate-100">Audit Trails & Telemetry</h2>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Browse and query the system event logging registry for compliance and base sanity.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 bg-slate-900/15 border border-slate-850/60 p-3 rounded-2xl backdrop-blur-md">
        <div className="relative">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Entity Type</label>
          <select className="input w-full font-medium" value={entity} onChange={(e) => setEntity(e.target.value)}>
            {entities.map((x) => <option key={x} value={x} className="bg-slate-950 text-slate-100">{x}</option>)}
          </select>
        </div>
        <div className="relative">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Action Type</label>
          <select className="input w-full font-medium" value={action} onChange={(e) => setAction(e.target.value)}>
            {actions.map((x) => <option key={x} value={x} className="bg-slate-950 text-slate-100">{x}</option>)}
          </select>
        </div>
      </div>

      <div className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead className="border-b border-slate-800/60 bg-slate-900/40 text-slate-400 font-semibold tracking-wider uppercase">
              <tr>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Entity</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Old Value</th>
                <th className="px-5 py-3.5">New Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30 text-slate-300">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/10 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-indigo-400">Actor #{r.actor_id}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center rounded-lg bg-slate-800/50 px-2 py-1 text-[10px] font-semibold text-slate-200 border border-slate-700/30">
                      {r.action}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-sans font-medium text-slate-250">
                    {r.entity_type} <span className="text-slate-500">#{r.entity_id}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 font-sans">{r.created_at}</td>
                  <td className="px-5 py-3.5 max-w-[200px] truncate font-mono text-[10px] text-rose-450">{r.old_value ?? "-"}</td>
                  <td className="px-5 py-3.5 max-w-[200px] truncate font-mono text-[10px] text-emerald-450">{r.new_value ?? "-"}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    No matching audit logs recorded in system telemetry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

