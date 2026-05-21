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
    <section>
      <h2 className="page-title">Audit Log View</h2>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <select className="input" value={entity} onChange={(e) => setEntity(e.target.value)}>{entities.map((x) => <option key={x}>{x}</option>)}</select>
        <select className="input" value={action} onChange={(e) => setAction(e.target.value)}>{actions.map((x) => <option key={x}>{x}</option>)}</select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Entity</th>
              <th className="px-3 py-2">Timestamp</th>
              <th className="px-3 py-2">Old</th>
              <th className="px-3 py-2">New</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-200">
                <td className="px-3 py-2">#{r.actor_id}</td>
                <td className="px-3 py-2 font-semibold">{r.action}</td>
                <td className="px-3 py-2">{r.entity_type} #{r.entity_id}</td>
                <td className="px-3 py-2">{r.created_at}</td>
                <td className="px-3 py-2">{r.old_value ?? "-"}</td>
                <td className="px-3 py-2">{r.new_value ?? "-"}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-500">No audit rows for selected filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
