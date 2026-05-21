import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
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
        await qc.cancelQueries({ queryKey: ["sorties"] });
        const previousSorties = qc.getQueryData<any[]>(["sorties"]);
        if (previousSorties) {
          qc.setQueryData<any[]>(
            ["sorties"],
            previousSorties.map((s) => (s.id === id ? { ...s, status: nextStatus } : s))
          );
        }
        return { previousSorties };
      },
      onError: (err: any, id: number, context: any) => {
        if (context?.previousSorties) {
          qc.setQueryData(["sorties"], context.previousSorties);
        }
        setMessage(err?.response?.data?.detail ?? "Action failed");
      },
      onSuccess: () => {
        setMessage(ok);
        // Clear message after 4 seconds
        setTimeout(() => setMessage(""), 4000);
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

  if (isLoading && !data.length) {
    return (
      <section className="space-y-6 font-sans">
        <h2 className="page-title">Flight Dispatch Board</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-10 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse"></div>
          <div className="h-10 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse"></div>
        </div>
        <div className="space-y-3 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 w-full rounded-2xl border border-slate-800/40 bg-slate-900/25 animate-pulse"></div>
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="border border-rose-500/20 bg-rose-950/15 rounded-2xl p-8 text-center max-w-xl mx-auto my-10 font-sans">
        <h2 className="text-rose-400 font-bold uppercase tracking-wider">Telemetry Connection Error</h2>
        <p className="mt-2 text-xs text-slate-400 font-sans leading-relaxed">Failed to synchronize flight sorties with the primary base operations server.</p>
        <button onClick={refresh} className="mt-4 btn-primary py-2 px-5 text-xs">
          Re-establish Connection
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-6 font-sans">
      
      {/* Title & Telemetry metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-850 pb-4">
        <div>
          <h2 className="page-title text-2xl font-bold tracking-tight text-slate-100">Flight Dispatch Board</h2>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Real-time sortie dispatching, track control, and active flight operations coordination.
          </p>
        </div>
        
        {/* Status Toast Message */}
        {message && (
          <div className="mt-2 sm:mt-0 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 shadow-lg shadow-indigo-950/20 animate-pulse">
            System Notice: {message}
          </div>
        )}
      </div>

      {/* Advanced Filter Console Bar */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 bg-slate-900/15 border border-slate-850/60 p-3 rounded-2xl backdrop-blur-md">
        <div className="relative">
          <input 
            className="input w-full" 
            placeholder="Search sortie number (e.g. SRT-001)" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
        </div>

        <div className="relative">
          <select 
            className="input w-full font-medium" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {["ALL", "SCHEDULED", "RELEASED", "AIRBORNE", "LANDED", "TRAINING_SUBMITTED", "TRAINING_APPROVED", "CLOSED", "CANCELLED"].map((s) => (
              <option key={s} value={s} className="bg-slate-950 text-slate-100">{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters helper */}
        <div className="flex items-center justify-between md:justify-end gap-3 px-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Sorties Filtered: {rows.length.toString().padStart(2, "0")} / {data.length.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Luxury Styled Table/Grid */}
      <div className="overflow-hidden rounded-2xl border border-slate-850 bg-slate-900/25 backdrop-blur-md shadow-xl shadow-black/10">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-850/60 text-left">
            <thead className="bg-slate-950/45 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4">Sortie ID</th>
                <th className="px-5 py-4">Cadet</th>
                <th className="px-5 py-4">Instructor</th>
                <th className="px-5 py-4">Aircraft</th>
                <th className="px-5 py-4">Base Station</th>
                <th className="px-5 py-4">Mission details</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/40 bg-transparent text-xs font-medium">
              {rows.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-950/20 transition-all duration-200 group">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <Link 
                      to={`/sorties/${s.id}`} 
                      className="text-indigo-400 font-bold hover:text-indigo-300 hover:underline transition-colors tracking-wide"
                    >
                      {s.sortie_number}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-slate-350 whitespace-nowrap">Cadet #{s.cadet_id}</td>
                  <td className="px-5 py-4 text-slate-350 whitespace-nowrap">Instructor #{s.instructor_id}</td>
                  <td className="px-5 py-4 text-slate-400 whitespace-nowrap">Reg: {s.aircraft_id}</td>
                  <td className="px-5 py-4 text-slate-500 whitespace-nowrap">Base #{s.base_id}</td>
                  <td className="px-5 py-4 text-slate-200 whitespace-nowrap">{s.lesson_type}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <StatusBadge value={s.status} />
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-all">
                      
                      {/* Release Button */}
                      <button 
                        className={`btn-success px-3 py-1.5 text-[10px] font-semibold ${!can.release(s) && "hidden"}`} 
                        disabled={!can.release(s)} 
                        onClick={() => mRelease.mutate(s.id)}
                      >
                        Release Flight
                      </button>
                      
                      {/* Take off Button */}
                      <button 
                        className={`btn-primary px-3 py-1.5 text-[10px] font-semibold ${!can.airborne(s) && "hidden"}`} 
                        disabled={!can.airborne(s)} 
                        onClick={() => mAirborne.mutate(s.id)}
                      >
                        Mark Airborne
                      </button>
                      
                      {/* Land Button */}
                      <button 
                        className={`btn-secondary border-indigo-500/30 text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 text-[10px] font-semibold ${!can.landed(s) && "hidden"}`} 
                        disabled={!can.landed(s)} 
                        onClick={() => mLanded.mutate(s.id)}
                      >
                        Mark Landed
                      </button>

                      {/* Archive/Close Button */}
                      <button 
                        className={`btn-secondary border-violet-500/30 text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-3 py-1.5 text-[10px] font-semibold ${!can.close(s) && "hidden"}`} 
                        disabled={!can.close(s)} 
                        onClick={() => mClose.mutate(s.id)}
                      >
                        Close Sortie
                      </button>
  
                      {/* Cancel Button */}
                      <button 
                        className={`btn-danger px-3 py-1.5 text-[10px] font-semibold ${!can.cancel(s) && "hidden"}`} 
                        disabled={!can.cancel(s)} 
                        onClick={() => mCancel.mutate(s.id)}
                      >
                        Cancel Flight
                      </button>

                      {/* Status Placeholder when no actions are available */}
                      {!can.release(s) && !can.airborne(s) && !can.landed(s) && !can.cancel(s) && !can.close(s) && (
                        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">No Action Cleared</span>
                      )}

                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    No flight sorties registered under matching filters.
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
