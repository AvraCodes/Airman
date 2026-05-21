import { useState } from "react";

interface SysOpManualProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SysOpManual({ isOpen, onClose }: SysOpManualProps) {
  const [activeTab, setActiveTab] = useState<"quickstart" | "roles" | "lifecycle">("quickstart");

  if (!isOpen) return null;

  const rolesData = [
    {
      role: "ADMIN",
      title: "🛠️ System Administrator",
      description: "Root level control. Oversees everything, manages the central database, and has full tactical override permissions.",
      abilities: [
        "Create, read, update, and delete users.",
        "Inspect all fleet sorties and base stations.",
        "Full read and write permission across all components.",
        "Access to complete filterable and paginated System Audit Logs."
      ]
    },
    {
      role: "DISPATCHER",
      title: "📡 Flight Dispatcher",
      description: "The core operator. Responsible for creating, planning, releasing, and scheduling flights. Coordinates hangar readiness.",
      abilities: [
        "Create new sorties in SCHEDULED status.",
        "Release sorties (moves them from SCHEDULED to RELEASED). Only works if the aircraft is READY (not grounded).",
        "Mark sorties as AIRBORNE and LANDED.",
        "Cancel sorties (from SCHEDULED or RELEASED phases).",
        "Report aircraft defects observed during operations.",
        "Access to complete filterable and paginated System Audit Logs."
      ]
    },
    {
      role: "INSTRUCTOR",
      title: "👨‍✈️ Flight Instructor",
      description: "The grader and flight coach. Mentors cadets and drafts progress evaluations after flight completion.",
      abilities: [
        "View assigned sorties and flights.",
        "Draft and submit detailed Training Progress records (evaluates maneuver scores, communications, situational awareness, and logs critical remarks)."
      ]
    },
    {
      role: "CFI",
      title: "🎖️ Chief Flying Instructor (CFI)",
      description: "Flight operations Commander. Approves cadet training evaluations and closes flight records.",
      abilities: [
        "Review drafted or submitted Training Progress reports.",
        "Approve evaluations (officially writes scores into record).",
        "Reject evaluations (requires a re-evaluation or modification).",
        "Officially CLOSE sorties (moves status to CLOSED after training approval)."
      ]
    },
    {
      role: "CADET",
      title: "🎓 Cadet Pilot",
      description: "The trainee. Performs missions and views their flight evaluations.",
      abilities: [
        "View own scheduled, airborne, or landed sorties.",
        "Read approved training progress reports and flight grades (cannot see drafts or rejections)."
      ]
    },
    {
      role: "MAINTENANCE OFFICER",
      title: "🔧 Maintenance Officer (MO)",
      description: "The hangar engineer. Inspects and resolves aircraft defects to keep the fleet flying.",
      abilities: [
        "View all active fleet defects and report new ones.",
        "Mark reported defects as RESOLVED (requires logging a recovery decision).",
        "Ground active aircraft (status GROUNDED) or approve them as READY."
      ]
    }
  ];

  const lifecycleStages = [
    { status: "SCHEDULED", description: "Sortie is created and assigned a cadet, instructor, plane, and lesson type.", actor: "DISPATCHER", rules: "Any aircraft status allowed." },
    { status: "RELEASED", description: "Pre-flight checks pass. Flight is cleared to taxi. Ready for takeoff.", actor: "DISPATCHER", rules: "Aircraft MUST be in READY status. Grounded planes cannot be released!" },
    { status: "AIRBORNE", description: "Aircraft has left the runway and is actively executing the lesson plan.", actor: "DISPATCHER", rules: "Requires the sortie to be RELEASED first." },
    { status: "LANDED", description: "Flight has safely returned to base. Ground crew and MO inspect the aircraft.", actor: "DISPATCHER", rules: "Requires the sortie to be AIRBORNE first." },
    { status: "TRAINING_SUBMITTED", description: "Evaluation is filled by the flight coach and sent to command.", actor: "INSTRUCTOR", rules: "Scores (1-5 scale) must be provided." },
    { status: "TRAINING_APPROVED", description: "Command reviews scores and approves cadet evaluation.", actor: "CFI", rules: "Can be rejected by CFI, returning it to draft state." },
    { status: "CLOSED", description: "Mission complete. Records are archived. Aircraft status is cleared.", actor: "CFI / DISPATCHER", rules: "Requires training evaluation to be approved first." },
    { status: "CANCELLED", description: "Sortie is terminated before takeoff.", actor: "DISPATCHER", rules: "Only allowed from SCHEDULED or RELEASED status." }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Manual Drawer Panel */}
      <div className="relative h-full w-full max-w-2xl border-l border-slate-800 bg-slate-900 p-6 shadow-2xl flex flex-col justify-between select-none">
        
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></div>
              <h2 className="text-lg font-bold tracking-wider text-slate-100 uppercase">
                [ SYS-OP MANUAL // FLIGHT RULES ]
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="rounded border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all uppercase"
            >
              Close [Esc]
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4 flex gap-1 border-b border-slate-800/60 pb-2">
            {(["quickstart", "roles", "lifecycle"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab 
                    ? "bg-cyan-950 text-cyan-400 border border-cyan-800/60 shadow-md shadow-cyan-950/50" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab === "quickstart" && "💡 Quick Start"}
                {tab === "roles" && "👥 Roles & Permissions"}
                {tab === "lifecycle" && "✈️ Sortie Lifecycle"}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto my-4 pr-1 scrollbar-thin">
          
          {/* 💡 Tab 1: Quick Start */}
          {activeTab === "quickstart" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-cyan-800/40 bg-cyan-950/20 p-4">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
                  Welcome Operator! How to Test this Site:
                </h3>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed font-sans">
                  Skynet is a flight operations console built to coordinate base stations, aircraft, sorties, and pilot training records. To experience the system fully, we recommend acting as different crew members using the preset accounts:
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400">STEP 1</span>
                    <span className="text-xs font-bold text-slate-200 uppercase">Dispatch a Flight (Role: Dispatcher)</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 font-sans leading-relaxed">
                    Log in as a **Dispatcher**. Go to the **Sortie Board** page, and click **Release** on a scheduled flight (VT-ABC is ready, but VT-SKY is grounded!). Once taxiing, click **Mark Airborne**. When back, click **Mark Landed**.
                  </p>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400">STEP 2</span>
                    <span className="text-xs font-bold text-slate-200 uppercase">Grade the Pilot (Role: Instructor)</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 font-sans leading-relaxed">
                    Once a flight lands, log in as an **Instructor**. Go to the **Training** page, select the completed flight, fill in the maneuver, communication, and situational scores, and click **Submit Draft**.
                  </p>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400">STEP 3</span>
                    <span className="text-xs font-bold text-slate-200 uppercase">Approve & Close (Role: CFI)</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 font-sans leading-relaxed">
                    Log in as **CFI (Chief Flying Instructor)**. Review the submitted training evaluation on the **Training** board. Click **Approve**. Finally, go to the **Sortie Board** and click **Close** to archive the sortie.
                  </p>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400">STEP 4</span>
                    <span className="text-xs font-bold text-slate-200 uppercase">Repair the Hangar (Role: Maint. Officer)</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 font-sans leading-relaxed">
                    If an aircraft has a defect (e.g. VT-SKY is grounded), log in as a **Maintenance Officer**. Go to the **Aircraft** list, select the defect, log a recovery decision, click **Resolve Defect**, and mark the aircraft status back to **READY**!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 👥 Tab 2: Roles Matrix */}
          {activeTab === "roles" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-sans">
                Role-Based Access Control (RBAC) is enforced system-wide. Switch roles to unlock pages and actions dynamically:
              </p>
              
              <div className="space-y-3">
                {rolesData.map((roleInfo) => (
                  <div key={roleInfo.role} className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 hover:border-slate-700/80 transition-all">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-sm font-bold text-slate-200">{roleInfo.title}</span>
                      <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 bg-slate-900 px-2 py-0.5 rounded">{roleInfo.role}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400 font-sans leading-relaxed">{roleInfo.description}</p>
                    <div className="mt-3">
                      <p className="text-[10px] uppercase font-bold text-amber-500/80 tracking-wider">Operational Clearance:</p>
                      <ul className="mt-1.5 list-disc list-inside space-y-1 text-xs text-slate-300 font-sans leading-relaxed">
                        {roleInfo.abilities.map((ability, idx) => (
                          <li key={idx}>{ability}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ✈️ Tab 3: Sortie Lifecycle */}
          {activeTab === "lifecycle" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-sans">
                Sorties follow a strict state-machine flow designed to replicate military and commercial flight compliance. Below are the sequential operational phases:
              </p>

              <div className="relative border-l-2 border-slate-800 ml-3 pl-6 space-y-5 py-2">
                {lifecycleStages.map((stage, idx) => (
                  <div key={stage.status} className="relative group">
                    {/* Node Dot Indicator */}
                    <div className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-slate-800 bg-slate-900 flex items-center justify-center group-hover:border-cyan-500 transition-colors">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-800 group-hover:bg-cyan-500 transition-colors"></div>
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3.5 hover:border-slate-700/80 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-400 tracking-wider">{idx + 1}. {stage.status}</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/60 px-1.5 py-0.5 rounded">
                          Actor: {stage.actor}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-300 font-sans leading-relaxed">{stage.description}</p>
                      <div className="mt-2 text-[10px] text-slate-500 font-mono">
                        <span className="text-amber-500/80 uppercase font-bold tracking-wider">Gate Check:</span> {stage.rules}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Metadata bar */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-[10px] text-slate-500 uppercase font-mono">
          <span>OPERATIONS MANUAL // VER: 1.0.4</span>
          <span>SKYNET FLIGHT MODULE READY</span>
        </div>

      </div>
    </div>
  );
}
