import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sortiesApi } from "../api/sorties";
import { useAuth } from "../hooks/useAuth";
import { StatusBadge } from "../components/StatusBadge";

export function SortieBoard() {
  const { user } = useAuth();
  const role = user?.role;
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const { data = [], isLoading, isError } = useQuery({ 
    queryKey: ["sorties"], 
    queryFn: sortiesApi.list,
    refetchInterval: 5000, // Live updates every 5 seconds
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["sorties"] });

  const mutation = (fn: (id: number) => Promise<any>, nextStatus: string, ok: string) =>
    useMutation({
      mutationFn: (id: number) => fn(id),
      onMutate: async (id: number) => {
        // Cancel outgoing queries
        await qc.cancelQueries({ queryKey: ["sorties"] });
        // Snapshot current queries state
        const previousSorties = qc.getQueryData<any[]>(["sorties"]);
        // Optimistically update state
        if (previousSorties) {
          qc.setQueryData<any[]>(
            ["sorties"],
            previousSorties.map((s) => (s.id === id ? { ...s, status: nextStatus } : s))
          );
        }
        return { previousSorties };
      },
      onError: (err: any, id: number, context: any) => {
        // Rollback state on failure
        if (context?.previousSorties) {
          qc.setQueryData(["sorties"], context.previousSorties);
        }
        setMessage(err?.response?.data?.detail ?? "Action failed");
      },
      onSuccess: () => {
        setMessage(ok);
      },
      onSettled: () => {
        refresh();
      },
    });

  const mRelease = mutation(sortiesApi.release, "RELEASED", "Sortie released successfully");
  const mAirborne = mutation(sortiesApi.airborne, "AIRBORNE", "Sortie marked airborne");
  const mLanded = mutation(sortiesApi.land, "LANDED", "Sortie marked landed");
  const mCancel = mutation(sortiesApi.cancel, "CANCELLED", "Sortie cancelled successfully");
  const mClose = mutation(sortiesApi.close, "CLOSED", "Sortie closed successfully");

  const rows = useMemo(
    () =>
      data
        .filter((s: any) => (statusFilter === "ALL" ? true : s.status === statusFilter))
        .filter((s: any) => s.sortie_number.toLowerCase().includes(query.toLowerCase())),
    [data, statusFilter, query],
  );

  const canDispatch = role === "DISPATCHER" || role === "ADMIN";
  const canClose = ["DISPATCHER", "CFI", "ADMIN"].includes(role || "");

  const can = {
    release: (s: any) => canDispatch && s.status === "SCHEDULED" && !mRelease.isPending,
    airborne: (s: any) => canDispatch && s.status === "RELEASED" && !mAirborne.isPending,
    landed: (s: any) => canDispatch && s.status === "AIRBORNE" && !mLanded.isPending,
    cancel: (s: any) => canDispatch && ["SCHEDULED", "RELEASED"].includes(s.status) && !mCancel.isPending,
    close: (s: any) => canClose && s.status === "TRAINING_APPROVED" && !mClose.isPending,
  };

  // Sleek animated table row loading skeletons
  if (isLoading && !data.length) {
    return (
      <section className="animate-pulse">
        <h2 className="page-title">Sortie Board</h2>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <div className="h-10 rounded-lg bg-slate-200"></div>
          <div className="h-10 rounded-lg bg-slate-200"></div>
        </div>
        <div className="mt-5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 w-full rounded-lg bg-slate-200"></div>
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="text-center py-10">
        <h2 className="page-title">Sortie Board</h2>
        <p className="mt-4 text-rose-600 font-medium">Could not fetch sorties. Please try again later.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="page-title">Sortie Board</h2>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <input className="input" placeholder="Search by sortie number" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {["ALL", "SCHEDULED", "RELEASED", "AIRBORNE", "LANDED", "TRAINING_SUBMITTED", "TRAINING_APPROVED", "CLOSED", "CANCELLED"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Sortie</th><th className="px-3 py-2">Cadet</th><th className="px-3 py-2">Instructor</th><th className="px-3 py-2">Aircraft</th><th className="px-3 py-2">Base</th><th className="px-3 py-2">Lesson</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s: any) => (
              <tr key={s.id} className="border-t border-slate-200">
                <td className="px-3 py-2 font-semibold">{s.sortie_number}</td>
                <td className="px-3 py-2">#{s.cadet_id}</td>
                <td className="px-3 py-2">#{s.instructor_id}</td>
                <td className="px-3 py-2">#{s.aircraft_id}</td>
                <td className="px-3 py-2">#{s.base_id}</td>
                <td className="px-3 py-2">{s.lesson_type}</td>
                <td className="px-3 py-2"><StatusBadge value={s.status} /></td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <button className="btn-secondary" disabled={!can.release(s)} onClick={() => mRelease.mutate(s.id)}>Release</button>
                    <button className="btn-secondary" disabled={!can.airborne(s)} onClick={() => mAirborne.mutate(s.id)}>Airborne</button>
                    <button className="btn-secondary" disabled={!can.landed(s)} onClick={() => mLanded.mutate(s.id)}>Landed</button>
                    <button className="btn-secondary" disabled={!can.cancel(s)} onClick={() => mCancel.mutate(s.id)}>Cancel</button>
                    <button className="btn-primary" disabled={!can.close(s)} onClick={() => mClose.mutate(s.id)}>Close</button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8} className="px-3 py-6 text-center text-slate-500">No sorties match current filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
