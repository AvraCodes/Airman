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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Manual Drawer Panel */}
      <div className="relative h-full w-full max-w-2xl border-l border-slate-850 bg-[#090d16]/95 backdrop-blur-2xl p-6 md:p-8 shadow-2xl flex flex-col justify-between select-none font-sans rounded-l-3xl">
        
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-850/60 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="pulse-cyan"></span>
              <h2 className="text-base font-bold tracking-tight text-slate-100">
                Operations Guide
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-900 hover:text-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-400 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-5 flex gap-1.5 border-b border-slate-850/40 pb-3">
            {(["quickstart", "roles", "lifecycle"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === tab 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/40" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/30"
                }`}
              >
                {tab === "quickstart" && "💡 Quick Start"}
                {tab === "roles" && "👥 Roles & Access"}
                {tab === "lifecycle" && "✈️ Sortie Cycles"}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto my-5 pr-2 scrollbar-thin">
          
          {/* 💡 Tab 1: Quick Start */}
          {activeTab === "quickstart" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-indigo-500/10 bg-indigo-500/5 p-5">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Testing Guide
                </h3>
                <p className="mt-2 text-xs text-slate-350 leading-relaxed font-sans">
                  Skynet orchestrates a complete flight operations cycle. Switch between the preset demo accounts to simulate different operational workflows:
                </p>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-slate-850 bg-slate-900/15 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">STEP 1</span>
                    <span className="text-xs font-bold text-slate-200">Dispatch a Flight (Role: Dispatcher)</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 font-sans leading-relaxed">
                    Log in as a **Dispatcher**. Open the **Flight Board**, and click **Release Flight** on a scheduled flight (VT-ABC is ready, but VT-SKY is grounded!). Click **Mark Airborne** when takeoff is reported. When landing is logged, click **Mark Landed**.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-850 bg-slate-900/15 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">STEP 2</span>
                    <span className="text-xs font-bold text-slate-200">Grade the Pilot (Role: Instructor)</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 font-sans leading-relaxed">
                    Once the flight lands, log in as an **Instructor**. Navigate to **Training**, select the completed flight, enter scores for maneuvers, communications, and situational awareness, and click **Create Record (Draft)**.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-850 bg-slate-900/15 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">STEP 3</span>
                    <span className="text-xs font-bold text-slate-200">Approve & Archive (Role: CFI)</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 font-sans leading-relaxed">
                    Log in as the **CFI (Chief Flying Instructor)**. Inspect the submitted pilot score logs in the **Training** tab, review recommendations, and click **Approve**. Lastly, return to the **Flight Board** and click **Close Sortie** to archive.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-850 bg-slate-900/15 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">STEP 4</span>
                    <span className="text-xs font-bold text-slate-200">Aircraft Repair (Role: Maint. Officer)</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 font-sans leading-relaxed">
                    When aircraft face defects (e.g. VT-SKY is grounded), log in as a **Maintenance Officer**. Open the **Aircraft** list, choose the active issue, write down your recovery decision notes, and click **Resolve** to declare the plane **READY**.
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
              
              <div className="space-y-4">
                {rolesData.map((roleInfo) => (
                  <div key={roleInfo.role} className="rounded-2xl border border-slate-850 bg-slate-900/10 p-5 hover:border-slate-800 transition-all duration-300">
                    <div className="flex items-center justify-between border-b border-slate-850/60 pb-3">
                      <span className="text-sm font-bold text-slate-250">{roleInfo.title}</span>
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/20 px-2.5 py-0.5 rounded-full border border-indigo-900/30">{roleInfo.role}</span>
                    </div>
                    <p className="mt-3 text-xs text-slate-400 font-sans leading-relaxed">{roleInfo.description}</p>
                    <div className="mt-4">
                      <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Permitted Directives:</p>
                      <ul className="mt-2 space-y-2 text-xs text-slate-300 font-sans leading-relaxed list-inside">
                        {roleInfo.abilities.map((ability, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-indigo-400 mt-0.5">•</span>
                            <span>{ability}</span>
                          </li>
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
                Sorties follow a strict state-machine flow designed to replicate flight compliance:
              </p>

              <div className="relative border-l border-slate-850 ml-3 pl-6 space-y-5 py-2">
                {lifecycleStages.map((stage, idx) => (
                  <div key={stage.status} className="relative group">
                    {/* Node Dot Indicator */}
                    <div className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center group-hover:border-indigo-500 transition-colors">
                      <div className="h-1 w-1 rounded-full bg-slate-800 group-hover:bg-indigo-500 transition-colors"></div>
                    </div>

                    <div className="rounded-2xl border border-slate-850 bg-slate-900/10 p-4 hover:border-slate-800 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400 tracking-wider">{idx + 1}. {stage.status.replace(/_/g, " ")}</span>
                        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-900/60 px-2 py-0.5 rounded-lg border border-slate-800">
                          Cleared Actor: {stage.actor}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-350 font-sans leading-relaxed">{stage.description}</p>
                      <div className="mt-3 text-[10px] text-slate-500 font-medium">
                        <span className="text-indigo-400/80 uppercase font-bold tracking-wider mr-1">Compliance Check:</span> {stage.rules}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Metadata bar */}
        <div className="border-t border-slate-850 pt-4 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wide font-medium">
          <span>Operations Handbook v1.0.4</span>
          <span className="text-indigo-400">System Nominal</span>
        </div>

      </div>
    </div>
  );
}
