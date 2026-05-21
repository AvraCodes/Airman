import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { sortiesApi } from "../api/sorties";
import { trainingApi } from "../api/trainingProgress";
import { useAuth } from "../hooks/useAuth";
import { StatusBadge } from "../components/StatusBadge";

export function TrainingProgress() {
  const { user } = useAuth();
  const role = user?.role;
  const [sortieId, setSortieId] = useState(1);
  const [scores, setScores] = useState({ maneuver: 3, comms: 3, sa: 3, remarks: "" });
  const [rejectRemarks, setRejectRemarks] = useState("Needs improvement in CRM");
  const [message, setMessage] = useState("");

  const { data: sorties = [] } = useQuery({ 
    queryKey: ["tp-sorties"], 
    queryFn: sortiesApi.list 
  });
  
  const selectedSortie = useMemo(() => sorties.find((s: any) => s.id === sortieId), [sorties, sortieId]);
  
  useEffect(() => {
    if (sorties.length && !sorties.find((s: any) => s.id === sortieId)) {
      setSortieId(sorties[0].id);
    }
  }, [sorties, sortieId]);

  const { data = [], refetch, isLoading } = useQuery({ 
    queryKey: ["training", sortieId], 
    queryFn: () => trainingApi.getBySortie(sortieId) 
  });
  
  const canInstructor = ["INSTRUCTOR", "ADMIN"].includes(role || "");
  const canCfi = ["CFI", "ADMIN"].includes(role || "");

  const create = useMutation({
    mutationFn: () => {
      if (!selectedSortie) throw new Error("No sortie selected");
      return trainingApi.create({
        sortie_id: sortieId,
        cadet_id: selectedSortie.cadet_id,
        instructor_id: selectedSortie.instructor_id,
        lesson_type: selectedSortie.lesson_type,
        maneuver_score: scores.maneuver,
        communication_score: scores.comms,
        situational_awareness_score: scores.sa,
        remarks: scores.remarks,
      });
    },
    onSuccess: async () => { 
      setMessage("Training record created successfully."); 
      await refetch(); 
    },
    onError: (e: any) => setMessage(e?.response?.data?.detail ?? "Create failed"),
  });

  const submit = useMutation({ 
    mutationFn: (id: number) => trainingApi.submit(id), 
    onSuccess: async () => { setMessage("Training record submitted for CFI review."); await refetch(); }, 
    onError: (e: any) => setMessage(e?.response?.data?.detail ?? "Submit failed") 
  });
  
  const approve = useMutation({ 
    mutationFn: (id: number) => trainingApi.approve(id), 
    onSuccess: async () => { setMessage("Training record approved successfully."); await refetch(); }, 
    onError: (e: any) => setMessage(e?.response?.data?.detail ?? "Approve failed") 
  });
  
  const reject = useMutation({ 
    mutationFn: (id: number) => trainingApi.reject(id, rejectRemarks), 
    onSuccess: async () => { setMessage("Training record rejected back to draft."); await refetch(); }, 
    onError: (e: any) => setMessage(e?.response?.data?.detail ?? "Reject failed") 
  });

  return (
    <section>
      <h2 className="page-title">Training Progress Form</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="font-semibold text-slate-800">Select Sortie</p>
          <select className="input mt-2" value={sortieId} onChange={(e) => setSortieId(Number(e.target.value))}>
            {sorties.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.sortie_number} ({s.status})
              </option>
            ))}
          </select>
          <button className="btn-secondary mt-2 w-full" onClick={() => refetch()}>Refresh Training Records</button>
        </div>

        {canInstructor && (
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="font-semibold text-slate-800">Instructor Evaluation</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500">Maneuver (1-5)</label>
                <input className="input mt-1" type="number" min={1} max={5} value={scores.maneuver} onChange={(e) => setScores((s) => ({ ...s, maneuver: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-slate-500">Communication (1-5)</label>
                <input className="input mt-1" type="number" min={1} max={5} value={scores.comms} onChange={(e) => setScores((s) => ({ ...s, comms: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-slate-500">Situational Awareness (1-5)</label>
                <input className="input mt-1" type="number" min={1} max={5} value={scores.sa} onChange={(e) => setScores((s) => ({ ...s, sa: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-slate-500">Lesson Type</label>
                <input className="input mt-1" disabled value={selectedSortie?.lesson_type || ""} />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs text-slate-500">Flight Evaluation Remarks (Mandatory)</label>
              <textarea className="input mt-1 h-20 resize-none" value={scores.remarks} onChange={(e) => setScores((s) => ({ ...s, remarks: e.target.value }))} placeholder="Provide detailed training remarks..." />
            </div>
            <button className="btn-primary mt-3 w-full" disabled={create.isPending || !scores.remarks.trim()} onClick={() => create.mutate()}>Create Record (Draft)</button>
          </div>
        )}
      </div>

      {canCfi && (
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <p className="font-semibold text-slate-800">CFI Reject Reason (Min 10 characters required for rejection)</p>
          <input className="input mt-2" value={rejectRemarks} onChange={(e) => setRejectRemarks(e.target.value)} placeholder="Provide explanation for rejection..." />
        </div>
      )}

      {message && <p className="mt-3 text-sm text-slate-700 font-semibold p-3 bg-slate-100 rounded-xl">{message}</p>}

      <div className="mt-4 space-y-2">
        {isLoading && <p className="muted">Loading training records...</p>}
        {!data.length && !isLoading && <p className="muted">No training progress records registered for this sortie.</p>}
        {data.map((t: any) => (
          <div key={t.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Training Record #{t.id}</p>
              <StatusBadge value={t.status} />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
              <div>Maneuver: <span className="font-bold text-slate-800">{t.maneuver_score}</span></div>
              <div>Communication: <span className="font-bold text-slate-800">{t.communication_score}</span></div>
              <div>SA: <span className="font-bold text-slate-800">{t.situational_awareness_score}</span></div>
            </div>
            <p className="text-sm text-slate-700 mt-2 bg-white border border-slate-100 p-2 rounded-lg italic">"{t.remarks || 'No remarks recorded'}"</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {canInstructor && <button className="btn-secondary" disabled={submit.isPending || (t.status !== "DRAFT" && t.status !== "REJECTED")} onClick={() => submit.mutate(t.id)}>Submit to CFI</button>}
              {canCfi && <button className="btn-primary" disabled={approve.isPending || t.status !== "SUBMITTED"} onClick={() => approve.mutate(t.id)}>Approve</button>}
              {canCfi && <button className="btn-secondary border-rose-200 text-rose-600 hover:bg-rose-50" disabled={reject.isPending || t.status !== "SUBMITTED" || rejectRemarks.trim().length < 10} onClick={() => reject.mutate(t.id)}>Reject</button>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
