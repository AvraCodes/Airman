import { StatusBadge } from "./StatusBadge";

export function SortieCard({ sortie }: { sortie: any }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{sortie.sortie_number}</h3>
        <StatusBadge value={sortie.status} />
      </div>
      <p className="mt-2 text-sm text-slate-600">{sortie.lesson_type}</p>
      <p className="text-xs text-slate-500">Cadet #{sortie.cadet_id} · Instructor #{sortie.instructor_id} · Aircraft #{sortie.aircraft_id}</p>
    </div>
  );
}
