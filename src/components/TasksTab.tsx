import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronDown, Lock, MessageSquare, AlertTriangle,
  ClipboardList, LogIn, Calendar, PackageOpen, CheckCircle,
} from "lucide-react";
import {
  PHASES, TASK_DATA, VAULT_INIT,
  type Property, type VaultDoc, type TaskItem,
} from "@/data/constants";

interface TasksTabProps {
  property: Property;
  completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>;
}

const PHASE_ICONS = [ClipboardList, LogIn, Calendar, PackageOpen, CheckCircle];

export function TasksTab({ property: p, completed, allVaults }: TasksTabProps) {
  const vault = allVaults[p.id] || VAULT_INIT;
  const isDocUp = (n: string) => vault.some(d => d.name === n && d.status === "uploaded");
  const isDone = (t: TaskItem) => !!completed[`${p.id}_${t.id}`] || !!(t.vaultDoc && isDocUp(t.vaultDoc));

  // Find current phase
  const curPhaseIdx = PHASES.findIndex(ph => {
    const tasks = (TASK_DATA["landlord"][ph] || []).filter(
      (t) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || p.isHmo)
    );
    return tasks.length > 0 && tasks.some(t => !isDone(t));
  });

  const [activePhase, setActivePhase] = useState(Math.max(curPhaseIdx, 0));
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const phaseTasks = (TASK_DATA["landlord"][PHASES[activePhase]] || []).filter(
    (t) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || p.isHmo)
  );

  const doneCounts = PHASES.map((ph, i) => {
    const tasks = (TASK_DATA["landlord"][ph] || []).filter(
      (t) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || p.isHmo)
    );
    const done = tasks.filter(isDone).length;
    return { total: tasks.length, done, allDone: tasks.length > 0 && done === tasks.length };
  });

  // Statutory obligations
  const obligations = [
    { label: "Deposit protected within 30 days", status: isDocUp("Deposit Protection Certificate") ? "met" : "action" },
    { label: "Annual Gas Safety check", status: isDocUp("Gas Safety Certificate") ? "met" : "action" },
    { label: "Valid EPC (min. rating E)", status: isDocUp("EPC Certificate") ? "met" : "action" },
    { label: "EICR valid (5-year cycle)", status: isDocUp("EICR Report") ? "met" : "action" },
    { label: "How to Rent guide provided", status: isDocUp("How to Rent Guide") ? "met" : "action" },
    { label: "Renters' Rights Act 2024 compliance", status: "review" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Contract status */}
      {p.contractUploaded ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-success-muted border border-success/20">
          <Check className="w-4 h-4 text-success" />
          <span className="text-sm font-medium text-foreground">Contract uploaded — all tasks unlocked</span>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-warning-muted border border-warning/20">
          <Lock className="w-4 h-4 text-warning" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">No contract uploaded</p>
            <p className="text-xs text-muted-foreground">Upload your AST to unlock all compliance tasks</p>
          </div>
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
            Upload AST
          </button>
        </div>
      )}

      {/* UK Statutory Obligations */}
      <StatutoryObligations obligations={obligations} />

      {/* Phase navigation */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          {PHASES.map((ph, i) => {
            const Icon = PHASE_ICONS[i];
            const { done, total, allDone } = doneCounts[i];
            const isCurrent = i === curPhaseIdx;
            const isActive = i === activePhase;

            return (
              <button
                key={ph}
                onClick={() => setActivePhase(i)}
                className="flex flex-col items-center gap-1.5 group flex-1"
              >
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all border-2",
                  allDone ? "bg-success/10 border-success text-success" :
                  isActive ? "bg-primary/10 border-primary text-primary" :
                  isCurrent ? "bg-warning/10 border-warning text-warning" :
                  "bg-secondary border-border text-muted-foreground"
                )}>
                  {allDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={cn(
                  "text-[10px] font-medium text-center leading-tight",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {ph.replace("-", " ")}
                </span>
                <span className="text-[9px] text-muted-foreground">{done}/{total}</span>
                {/* Connecting line */}
                {i < PHASES.length - 1 && (
                  <div className="absolute" />
                )}
              </button>
            );
          })}
        </div>

        {/* Phase progress bar */}
        <div className="flex gap-1">
          {PHASES.map((_, i) => {
            const { done, total, allDone } = doneCounts[i];
            const pct = total > 0 ? (done / total) * 100 : 0;
            return (
              <div key={i} className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500",
                    allDone ? "bg-success" : pct > 0 ? "bg-primary" : ""
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Task list */}
      <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-display text-sm font-bold text-foreground">
            {PHASES[activePhase]} — {doneCounts[activePhase].done}/{doneCounts[activePhase].total} complete
          </h3>
        </div>

        {phaseTasks.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No tasks in this phase</div>
        ) : (
          <div className="divide-y divide-border">
            {phaseTasks.map((task) => {
              const done = isDone(task);
              const isExpanded = expandedTask === task.id;
              const locked = !p.contractUploaded && task.blocked;

              return (
                <div key={task.id} className={cn("transition-colors", done && "bg-success-muted/40")}>
                  <button
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-secondary/30 transition-colors"
                    disabled={locked}
                  >
                    {/* Checkbox */}
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                      done ? "bg-success border-success" :
                      locked ? "bg-secondary border-border" :
                      "border-border"
                    )}>
                      {done && <Check className="w-3 h-3 text-success-foreground" />}
                      {locked && <Lock className="w-3 h-3 text-muted-foreground/50" />}
                    </div>

                    {/* Label */}
                    <span className={cn(
                      "text-sm font-medium flex-1",
                      done ? "text-muted-foreground line-through" : locked ? "text-muted-foreground" : "text-foreground"
                    )}>
                      {task.label}
                    </span>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={cn(
                        "text-[10px] font-semibold rounded-full px-2 py-0.5",
                        task.type === "legal" ? "text-danger bg-danger-muted" : "text-info bg-info-muted"
                      )}>
                        {task.type === "legal" ? "Legal" : "Suggested"}
                      </span>
                      {task.vaultDoc && (
                        <span className="text-[10px] font-semibold text-primary bg-landlord-light rounded-full px-2 py-0.5">
                          Vault
                        </span>
                      )}
                      {task.hasChat && (
                        <MessageSquare className="w-3.5 h-3.5 text-success" />
                      )}
                      <ChevronDown className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                    </div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 pl-[52px]">
                          <p className="text-xs text-muted-foreground mb-3">{task.detail}</p>
                          <div className="flex gap-2">
                            {task.vaultDoc && !done && (
                              <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                                Upload document
                              </button>
                            )}
                            {task.hasChat && (
                              <button className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold">
                                Open thread
                              </button>
                            )}
                            {!done && !task.vaultDoc && (
                              <button className="px-3 py-1.5 rounded-lg bg-success text-success-foreground text-xs font-semibold">
                                Mark complete
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatutoryObligations({ obligations }: { obligations: { label: string; status: string }[] }) {
  const [open, setOpen] = useState(false);
  const actionCount = obligations.filter(o => o.status !== "met").length;

  return (
    <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <span className="text-sm font-semibold text-foreground">UK Statutory Obligations</span>
          {actionCount > 0 && (
            <span className="text-[10px] font-bold bg-warning text-warning-foreground rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {actionCount}
            </span>
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {obligations.map((ob, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/40">
                  <span className="text-xs font-medium text-foreground">{ob.label}</span>
                  <span className={cn(
                    "text-[10px] font-semibold rounded-full px-2 py-0.5",
                    ob.status === "met" ? "text-success bg-success-muted" :
                    ob.status === "review" ? "text-warning bg-warning-muted" :
                    "text-danger bg-danger-muted"
                  )}>
                    {ob.status === "met" ? "Met" : ob.status === "review" ? "Review" : "Action due"}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
