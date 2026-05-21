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
      title: "System Administrator",
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
      title: "Flight Dispatcher",
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
      title: "Flight Instructor",
      description: "The grader and flight coach. Mentors cadets and drafts progress evaluations after flight completion.",
      abilities: [
        "View assigned sorties and flights.",
        "Draft and submit detailed Training Progress records (evaluates maneuver scores, communications, situational awareness, and logs critical remarks)."
      ]
    },
    {
      role: "CFI",
      title: "Chief Flying Instructor (CFI)",
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
      title: "Cadet Pilot",
      description: "The trainee. Performs missions and views their flight evaluations.",
      abilities: [
        "View own scheduled, airborne, or landed sorties.",
        "Read approved training progress reports and flight grades (cannot see drafts or rejections)."
      ]
    },
    {
      role: "MAINTENANCE OFFICER",
      title: "Maintenance Officer (MO)",
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

  const getRoleIcon = (r: string) => {
    switch (r) {
      case "ADMIN":
        return (
          <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
        );
      case "DISPATCHER":
        return (
          <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-1.414a5 5 0 117.07 0M12 11h.01" />
          </svg>
        );
      case "INSTRUCTOR":
        return (
          <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "CFI":
        return (
          <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case "CADET":
        return (
          <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
          </svg>
        );
      case "MAINTENANCE OFFICER":
        return (
          <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Manual Drawer Panel */}
      <div className="relative h-full w-full max-w-2xl border-l border-slate-200 dark:border-slate-850 bg-white dark:bg-[#090d16]/95 backdrop-blur-2xl p-6 md:p-8 shadow-2xl flex flex-col justify-between select-none font-sans rounded-l-3xl">
        
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850/60 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="pulse-cyan"></span>
              <h2 className="text-base font-black tracking-widest text-slate-900 dark:text-slate-100 font-mono uppercase">
                OPERATIONS // MANUAL
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950/80 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer font-mono uppercase tracking-widest"
            >
              CLOSE
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-5 flex gap-1.5 border-b border-slate-200 dark:border-slate-850/40 pb-3">
            {(["quickstart", "roles", "lifecycle"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-2.5 text-[10px] font-black tracking-widest transition-all cursor-pointer border ${
                  activeTab === tab 
                    ? "bg-cyan-600 border-cyan-600 text-white shadow-lg shadow-cyan-950/40" 
                    : "border-slate-200 dark:border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                }`}
              >
                {tab === "quickstart" && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    SYS.QUICKSTART
                  </span>
                )}
                {tab === "roles" && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    SYS.ROLES
                  </span>
                )}
                {tab === "lifecycle" && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    SYS.LIFECYCLE
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto my-5 pr-2 scrollbar-thin">
          
          {/* Tab 1: Quick Start */}
          {activeTab === "quickstart" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-cyan-200 dark:border-cyan-500/10 bg-cyan-50/40 dark:bg-cyan-500/5 p-5">
                <h3 className="text-xs font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  TESTING PROCEDURE // READOUT
                </h3>
                <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                  Skynet orchestrates a complete flight operations cycle. Switch between the preset demo accounts in the console gate to simulate different security clearance directives:
                </p>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/15 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20 font-mono">01 // DISPATCH</span>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-200 font-mono uppercase tracking-wide">Schedule & Release Fleet</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Log in as a <strong className="text-cyan-600 dark:text-cyan-400">Dispatcher</strong>. Open the <strong className="text-slate-700 dark:text-slate-300">Flight Board</strong>, and click <strong className="text-slate-700 dark:text-slate-300">Release Flight</strong> on a scheduled flight (VT-ABC is ready, but VT-SKY is grounded!). Transition state to <strong className="text-slate-700 dark:text-slate-300">Airborne</strong> on takeoff, and then <strong className="text-slate-700 dark:text-slate-300">Landed</strong> on runway arrival.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/15 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20 font-mono">02 // INSTRUCT</span>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-200 font-mono uppercase tracking-wide">Grade Student Sortie</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Once the flight safely lands, log in as an <strong className="text-cyan-600 dark:text-cyan-400">Instructor</strong>. Navigate to the <strong className="text-slate-700 dark:text-slate-300">Training</strong> dashboard, evaluate critical maneuvers, flight comms, situational awareness, enter comments, and click <strong className="text-slate-700 dark:text-slate-300">Create Record</strong>.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/15 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20 font-mono">03 // COMMAND</span>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-200 font-mono uppercase tracking-wide">Command Approval & Close</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Log in as the <strong className="text-cyan-600 dark:text-cyan-400">CFI (Chief Flying Instructor)</strong>. Inspect the submitted pilot score evaluations in the <strong className="text-slate-700 dark:text-slate-300">Training</strong> list, review remarks, and click <strong className="text-slate-700 dark:text-slate-300">Approve</strong>. Return to the <strong className="text-slate-700 dark:text-slate-300">Flight Board</strong> and click <strong className="text-slate-700 dark:text-slate-300">Close Sortie</strong> to archive.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/15 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20 font-mono">04 // REPAIR</span>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-200 font-mono uppercase tracking-wide">Hangar Maintenance</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    When aircraft report defects (e.g. VT-SKY is grounded), log in as a <strong className="text-cyan-600 dark:text-cyan-400">Maintenance Officer</strong>. Open the <strong className="text-slate-700 dark:text-slate-300">Aircraft Readiness</strong> panel, select the issue, log your recovery solution, and click <strong className="text-slate-700 dark:text-slate-300">Resolve</strong> to declare the plane <strong className="text-slate-700 dark:text-slate-300">READY</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Roles Matrix */}
          {activeTab === "roles" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                System-wide Role-Based Access Control (RBAC) is active. Change profiles to dynamically shift operations:
              </p>
              
              <div className="space-y-4">
                {rolesData.map((roleInfo) => (
                  <div key={roleInfo.role} className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/10 p-5 hover:border-cyan-500/30 transition-all duration-300">
                     <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850/60 pb-3">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono uppercase flex items-center gap-2">
                        {getRoleIcon(roleInfo.role)}
                        {roleInfo.title}
                      </span>
                      <span className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-950/20 px-2.5 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-900/30 font-mono">
                        {roleInfo.role}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{roleInfo.description}</p>
                    <div className="mt-4">
                      <p className="text-[9px] uppercase font-black text-cyan-600 dark:text-cyan-400 tracking-wider font-mono">// SECURE PERMITTED DIRECTIVES:</p>
                      <ul className="mt-2 space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed list-inside font-medium">
                        {roleInfo.abilities.map((ability, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-cyan-600 dark:text-cyan-400 mt-0.5 shrink-0 font-mono">•</span>
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

          {/* Tab 3: Sortie Lifecycle */}
          {activeTab === "lifecycle" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Sorties follow a strict state-machine flow designed to replicate flight compliance:
              </p>

              {/* Bold industrial blueprint vertical line and timeline nodes */}
              <div className="relative border-l-2 border-cyan-200 dark:border-cyan-800 ml-3 pl-6 space-y-6 py-2">
                {lifecycleStages.map((stage, idx) => (
                  <div key={stage.status} className="relative group">
                    {/* Node Dot Indicator (Blueprint styled) */}
                    <div className="absolute -left-[32px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-cyan-600 dark:border-cyan-400 bg-white dark:bg-[#090d16] flex items-center justify-center transition-transform duration-250 group-hover:scale-110">
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-600 dark:bg-cyan-400"></div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/10 p-4 hover:border-cyan-500/30 transition-all duration-300">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 tracking-wider font-mono">
                          {String(idx + 1).padStart(2, "0")} // {stage.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-900/60 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono">
                          ACTOR: {stage.actor}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">{stage.description}</p>
                      <div className="mt-3 text-[10px] text-slate-500 dark:text-slate-400 font-mono border-t border-slate-200 dark:border-slate-800/20 pt-2.5">
                        <span className="text-cyan-600 dark:text-cyan-400/80 uppercase font-black tracking-widest mr-1">CHECK:</span> {stage.rules}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Metadata bar */}
        <div className="border-t border-slate-200 dark:border-slate-850 pt-4 flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono font-bold">
          <span>OP.MANUAL // V1.0.4</span>
          <span className="text-cyan-600 dark:text-cyan-400">STATUS: NOMINAL</span>
        </div>

      </div>
    </div>
  );
}
