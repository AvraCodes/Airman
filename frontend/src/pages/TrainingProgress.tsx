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
    <section className="space-y-6 font-sans">
      
      {/* Header Panel */}
      <div className="border-b border-slate-850 pb-4">
        <h2 className="page-title text-2xl font-bold tracking-tight text-slate-100">Flight Training Evaluation</h2>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Draft performance grades, evaluate cadet maneuvers, and review chief flying instructor command approvals.
        </p>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        
        {/* Left Card: Sortie Selector */}
        <div className="app-card border-slate-800/40 p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
              Active Flight Selection
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Select a sortie reference to record pilot performance or inspect records.</p>
            <select className="input mt-3.5 font-medium" value={sortieId} onChange={(e) => setSortieId(Number(e.target.value))}>
              {sorties.map((s: any) => (
                <option key={s.id} value={s.id} className="bg-slate-950 text-slate-100">
                  {s.sortie_number} — Status: {s.status.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-secondary w-full py-2.5" onClick={() => refetch()}>
            Sync Training Logs
          </button>
        </div>

        {/* Right Card: Instructor Evaluation */}
        {canInstructor && (
          <div className="app-card border-slate-800/40 p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400"></span>
              Performance Scoring Matrix
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Maneuver Score (1-5)</label>
                <input className="input" type="number" min={1} max={5} value={scores.maneuver} onChange={(e) => setScores((s) => ({ ...s, maneuver: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Communication (1-5)</label>
                <input className="input" type="number" min={1} max={5} value={scores.comms} onChange={(e) => setScores((s) => ({ ...s, comms: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Situational (1-5)</label>
                <input className="input" type="number" min={1} max={5} value={scores.sa} onChange={(e) => setScores((s) => ({ ...s, sa: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lesson Type</label>
                <input className="input opacity-60" disabled value={selectedSortie?.lesson_type || "None"} />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Flight Performance Summary Remarks</label>
              <textarea className="input h-20 resize-none" value={scores.remarks} onChange={(e) => setScores((s) => ({ ...s, remarks: e.target.value }))} placeholder="Provide comments on cadet maneuvers, compliance, or concerns..." />
            </div>
            <button className="btn-primary mt-4 w-full py-2.5 font-bold" disabled={create.isPending || !scores.remarks.trim()} onClick={() => create.mutate()}>
              Draft Evaluation Report
            </button>
          </div>
        )}
      </div>

      {/* CFI Review Comments Section */}
      {canCfi && (
        <div className="app-card border-slate-800/40 p-6 mt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2 flex items-center gap-2">
            <span>🎖️</span> Command Review Directive
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mb-3">If rejecting a drafted training score, provide constructive training remarks (min 10 characters).</p>
          <input className="input" value={rejectRemarks} onChange={(e) => setRejectRemarks(e.target.value)} placeholder="Provide explanation for rejection..." />
        </div>
      )}

      {/* Action Toast Messages */}
      {message && (
        <div className="rounded-xl border border-indigo-500/10 bg-indigo-500/5 px-4 py-3 text-xs text-indigo-300 font-semibold shadow-md animate-pulse">
          System Notice: {message}
        </div>
      )}

      {/* Registered Records Log */}
      <div className="mt-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Dossier Evaluation Records</h3>
        
        {isLoading && <p className="text-xs text-slate-500 animate-pulse">Retrieving student logs...</p>}
        {!data.length && !isLoading && (
          <p className="text-xs text-slate-500 py-3">No evaluations currently logged for this sortie profile.</p>
        )}
        
        {data.map((t: any) => (
          <div key={t.id} className="app-card border-slate-850 bg-slate-900/10 p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-850/60 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evaluation ID Reference</span>
                <p className="text-xs font-bold text-slate-250 mt-0.5">Record Entry #{t.id}</p>
              </div>
              <StatusBadge value={t.status} />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs font-bold bg-slate-950/45 p-3 rounded-xl border border-slate-900/80 max-w-md">
              <div>
                <span className="block text-[8px] uppercase tracking-wider text-slate-500 mb-1">Maneuver Score</span>
                <span className="text-indigo-400 text-sm font-extrabold">{t.maneuver_score} / 5</span>
              </div>
              <div className="border-x border-slate-900">
                <span className="block text-[8px] uppercase tracking-wider text-slate-500 mb-1">Comms Quality</span>
                <span className="text-indigo-400 text-sm font-extrabold">{t.communication_score} / 5</span>
              </div>
              <div>
                <span className="block text-[8px] uppercase tracking-wider text-slate-500 mb-1">Situational Awareness</span>
                <span className="text-indigo-400 text-sm font-extrabold">{t.situational_awareness_score} / 5</span>
              </div>
            </div>

            <p className="text-xs text-slate-350 bg-slate-950/40 p-3.5 rounded-xl border border-slate-850/30 italic leading-relaxed">
              Remarks: "{t.remarks || 'No performance remarks recorded.'}"
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {canInstructor && (t.status === "DRAFT" || t.status === "REJECTED") && (
                <button className="btn-primary py-2 px-4 text-[10px] font-semibold" disabled={submit.isPending} onClick={() => submit.mutate(t.id)}>
                  Submit to CFI
                </button>
              )}
              {canCfi && t.status === "SUBMITTED" && (
                <button className="btn-success py-2 px-4 text-[10px] font-semibold" disabled={approve.isPending} onClick={() => approve.mutate(t.id)}>
                  Approve Record
                </button>
              )}
              {canCfi && t.status === "SUBMITTED" && (
                <button className="btn-secondary border-rose-500/20 text-rose-450 hover:bg-rose-950/20 py-2 px-4 text-[10px] font-semibold" disabled={reject.isPending || rejectRemarks.trim().length < 10} onClick={() => reject.mutate(t.id)}>
                  Reject Report
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
