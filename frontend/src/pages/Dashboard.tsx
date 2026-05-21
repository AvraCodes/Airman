import { useQuery } from "@tanstack/react-query";
import { aircraftApi } from "../api/aircraft";
import { sortiesApi } from "../api/sorties";
import { useAuth } from "../hooks/useAuth";

export function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;
  const { data: sorties = [], isLoading: loadingSorties } = useQuery({ 
    queryKey: ["dash-sorties"], 
    queryFn: sortiesApi.list,
    refetchInterval: 5000, // Live status updates every 5 seconds
  });
  const { data: aircraft = [], isLoading: loadingAircraft } = useQuery({ 
    queryKey: ["dash-aircraft"], 
    queryFn: aircraftApi.list,
    refetchInterval: 5000, // Live updates every 5 seconds
  });

  const isLoading = loadingSorties || loadingAircraft;

  const metric = (status: string) => sorties.filter((s: any) => s.status === status).length;

  const cards = [
    ["Total sorties today", sorties.length],
    ["Released sorties", metric("RELEASED")],
    ["Airborne sorties", metric("AIRBORNE")],
    ["Landed sorties", metric("LANDED")],
    ["Grounded aircraft", aircraft.filter((a: any) => a.status === "GROUNDED").length],
    ["Pending approvals", metric("TRAINING_SUBMITTED")],
    ["Delayed sorties", sorties.filter((s: any) => s.delay_minutes > 0).length],
  ];

  return (
    <section>
      <h2 className="page-title">Operations Dashboard</h2>
      <p className="muted mt-1 flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        Live operational snapshot for current role: <strong className="text-slate-800">{role || "Unknown"}</strong>
      </p>

      {isLoading ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 animate-pulse">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4 h-24">
              <div className="h-4 w-2/3 rounded bg-slate-200"></div>
              <div className="mt-2 h-8 w-1/3 rounded bg-slate-300"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([title, value]) => (
            <div key={title as string} className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:shadow-md hover:border-slate-300">
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{String(value)}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
