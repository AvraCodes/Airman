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
      <section className="space-y-4">
        <h2 className="page-title">[ LIVE FLIGHT BOARD TERMINAL ]</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-9 rounded bg-slate-900/60 border border-slate-800 animate-pulse"></div>
          <div className="h-9 rounded bg-slate-900/60 border border-slate-800 animate-pulse"></div>
        </div>
        <div className="space-y-2 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 w-full rounded border border-slate-800/40 bg-slate-900/25 animate-pulse"></div>
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="border border-red-500/20 bg-red-950/20 rounded-xl p-8 text-center max-w-xl mx-auto my-10">
        <h2 className="text-red-400 font-bold uppercase tracking-wider">⚠️ TELEMETRY CONNECTION ERROR</h2>
        <p className="mt-2 text-xs text-slate-400 font-mono">Failed to synchronize sorties with local Base server.</p>
        <button onClick={refresh} className="mt-4 px-4 py-2 bg-red-950 text-red-300 border border-red-800 rounded font-bold text-xs uppercase tracking-wider hover:bg-red-900/50">
          Re-establish Connection
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      
      {/* Title & Telemetry metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="page-title">[ Live Flight Board Terminal ]</h2>
          <p className="text-[10px] font-bold font-mono text-slate-500 mt-1 uppercase tracking-widest">
            ACTIVE FLIGHT DISPATCH & TRAFFIC COORDINATION UNIT // BASE: BLR
          </p>
        </div>
        
        {/* Status Toast Message */}
        {message && (
          <div className="mt-2 sm:mt-0 px-3 py-1 text-xs font-mono font-bold uppercase bg-cyan-950 text-cyan-400 border border-cyan-800 rounded animate-pulse">
            SYS: {message}
          </div>
        )}
      </div>

      {/* Advanced Filter Console Bar */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 bg-slate-900/25 border border-slate-850 p-3 rounded-lg backdrop-blur">
        <div className="relative">
          <input 
            className="input" 
            placeholder="FILTER BY SORTIE (e.g. SRT-001)" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
          <span className="absolute right-2.5 top-2.5 text-[8px] font-mono text-slate-600 font-black">SEARCH</span>
        </div>

        <div className="relative">
          <select 
            className="input uppercase font-mono font-bold" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {["ALL", "SCHEDULED", "RELEASED", "AIRBORNE", "LANDED", "TRAINING_SUBMITTED", "TRAINING_APPROVED", "CLOSED", "CANCELLED"].map((s) => (
              <option key={s} value={s} className="bg-slate-900 text-slate-100">{s}</option>
            ))}
          </select>
          <span className="absolute right-6 top-2.5 text-[8px] font-mono text-slate-600 font-black">STATUS</span>
        </div>

        {/* Clear Filters helper */}
        <div className="flex items-center justify-end">
          <span className="text-[9px] font-mono text-slate-600 font-bold uppercase">
            ROW COUNT: {rows.length.toString().padStart(2, "0")} / {data.length.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Industrial Grid-table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/20 backdrop-blur-md">
        <table className="min-w-full text-xs font-mono">
          <thead className="bg-slate-950 text-left text-slate-500 uppercase tracking-widest border-b border-slate-800">
            <tr>
              <th className="px-4 py-3 text-[10px] font-black">[ Sortie ]</th>
              <th className="px-4 py-3 text-[10px] font-black">[ Cadet ]</th>
              <th className="px-4 py-3 text-[10px] font-black">[ Instructor ]</th>
              <th className="px-4 py-3 text-[10px] font-black">[ Aircraft ]</th>
              <th className="px-4 py-3 text-[10px] font-black">[ Base ]</th>
              <th className="px-4 py-3 text-[10px] font-black">[ Mission ]</th>
              <th className="px-4 py-3 text-[10px] font-black">[ Telemetry ]</th>
              <th className="px-4 py-3 text-[10px] font-black text-right">[ Actions ]</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/80">
            {rows.map((s: any) => (
              <tr key={s.id} className="hover:bg-slate-900/40 transition-colors group">
                <td className="px-4 py-3">
                  <Link 
                    to={`/sorties/${s.id}`} 
                    className="text-cyan-400 font-bold hover:text-cyan-300 hover:underline decoration-cyan-500/50 decoration-dotted tracking-wider"
                  >
                    {s.sortie_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-300 font-sans">Cadet #{s.cadet_id}</td>
                <td className="px-4 py-3 text-slate-300 font-sans">Instr. #{s.instructor_id}</td>
                <td className="px-4 py-3 text-slate-400">Reg: {s.aircraft_id}</td>
                <td className="px-4 py-3 text-slate-500">BASE-{s.base_id}</td>
                <td className="px-4 py-3 text-slate-200 tracking-wide font-sans">{s.lesson_type}</td>
                <td className="px-4 py-3">
                  <StatusBadge value={s.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    
                    {/* Release Button */}
                    <button 
                      className={`btn-success px-2.5 py-1 text-[10px] ${!can.release(s) && "hidden"}`} 
                      disabled={!can.release(s)} 
                      onClick={() => mRelease.mutate(s.id)}
                    >
                      Release
                    </button>
                    
                    {/* Take off Button */}
                    <button 
                      className={`btn-primary px-2.5 py-1 text-[10px] ${!can.airborne(s) && "hidden"}`} 
                      disabled={!can.airborne(s)} 
                      onClick={() => mAirborne.mutate(s.id)}
                    >
                      Takeoff
                    </button>
                    
                    {/* Land Button */}
                    <button 
                      className={`btn-secondary border-cyan-800 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-900/40 px-2.5 py-1 text-[10px] ${!can.landed(s) && "hidden"}`} 
                      disabled={!can.landed(s)} 
                      onClick={() => mLanded.mutate(s.id)}
                    >
                      Land
                    </button>

                    {/* Archive/Close Button */}
                    <button 
                      className={`btn-secondary border-violet-800 text-violet-400 bg-violet-950/20 hover:bg-violet-900/40 px-2.5 py-1 text-[10px] ${!can.close(s) && "hidden"}`} 
                      disabled={!can.close(s)} 
                      onClick={() => mClose.mutate(s.id)}
                    >
                      Archive
                    </button>

                    {/* Cancel Button */}
                    <button 
                      className={`btn-danger px-2.5 py-1 text-[10px] ${!can.cancel(s) && "hidden"}`} 
                      disabled={!can.cancel(s)} 
                      onClick={() => mCancel.mutate(s.id)}
                    >
                      Cancel
                    </button>

                    {/* Status Placeholder when no actions are available */}
                    {!can.release(s) && !can.airborne(s) && !can.landed(s) && !can.cancel(s) && !can.close(s) && (
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">NO ACTIONS</span>
                    )}

                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500 font-sans">
                  No sorties found matching the current terminal telemetry filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </section>
  );
}
