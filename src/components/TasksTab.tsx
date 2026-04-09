import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Lock, MessageSquare, AlertTriangle,
  ClipboardList, LogIn, Calendar, PackageOpen, CheckCircle,
  FileText, Upload, ChevronRight,
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

  const curPhaseIdx = PHASES.findIndex(ph => {
    const tasks = (TASK_DATA["landlord"][ph] || []).filter(
      (t) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || p.isHmo)
    );
    return tasks.length > 0 && tasks.some(t => !isDone(t));
  });

  const [activePhase, setActivePhase] = useState(Math.max(curPhaseIdx, 0));
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const phaseTasks = (TASK_DATA["landlord"][PHASES[activePhase]] || []).filter(
    (t) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || p.isHmo)
  );

  const doneCounts = PHASES.map((ph) => {
    const tasks = (TASK_DATA["landlord"][ph] || []).filter(
      (t) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || p.isHmo)
    );
    const done = tasks.filter(isDone).length;
    return { total: tasks.length, done, allDone: tasks.length > 0 && done === tasks.length };
  });

  const selectedTaskData = phaseTasks.find(t => t.id === selectedTask);

  // Statutory obligations
  const obligations = [
    { label: "Deposit protected within 30 days", status: isDocUp("Deposit Protection Certificate") ? "met" : "action" },
    { label: "Annual Gas Safety check", status: isDocUp("Gas Safety Certificate") ? "met" : "action" },
    { label: "Valid EPC (min. rating E)", status: isDocUp("EPC Certificate") ? "met" : "action" },
    { label: "EICR valid (5-year cycle)", status: isDocUp("EICR Report") ? "met" : "action" },
    { label: "How to Rent guide provided", status: isDocUp("How to Rent Guide") ? "met" : "action" },
    { label: "Renters' Rights Act 2024 compliance", status: "review" },
  ];

  const actionCount = obligations.filter(o => o.status !== "met").length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Contract status — compact */}
      {p.contractUploaded ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success-muted border border-success/20">
          <Check className="w-3.5 h-3.5 text-success" />
          <span className="text-xs font-medium text-foreground">Contract uploaded — all tasks unlocked</span>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-warning-muted border border-warning/20">
          <Lock className="w-4 h-4 text-warning" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground">No contract uploaded</p>
            <p className="text-[10px] text-muted-foreground">Upload your AST to unlock all compliance tasks</p>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-semibold">Upload AST</button>
        </div>
      )}

      {/* Statutory obligations — inline summary */}
      {actionCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/5 border border-warning/15">
          <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
          <span className="text-[11px] font-medium text-foreground">{actionCount} statutory obligation{actionCount > 1 ? "s" : ""} need attention</span>
          <div className="flex gap-1 ml-auto">
            {obligations.filter(o => o.status !== "met").slice(0, 3).map((o, i) => (
              <span key={i} className={cn("text-[9px] font-semibold rounded-full px-1.5 py-0.5",
                o.status === "review" ? "text-warning bg-warning-muted" : "text-danger bg-danger-muted"
              )}>{o.label.split(" ").slice(0, 2).join(" ")}</span>
            ))}
          </div>
        </div>
      )}

      {/* Phase navigation bar */}
      <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
        {PHASES.map((ph, i) => {
          const Icon = PHASE_ICONS[i];
          const { done, total, allDone } = doneCounts[i];
          const isActive = i === activePhase;
          return (
            <button
              key={ph}
              onClick={() => { setActivePhase(i); setSelectedTask(null); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-medium transition-all flex-1 justify-center",
                isActive ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {allDone ? (
                <Check className="w-3 h-3 text-success" />
              ) : (
                <Icon className={cn("w-3 h-3", isActive ? "text-primary" : "")} />
              )}
              <span className="hidden lg:inline">{ph}</span>
              <span className="text-[9px] opacity-60">{done}/{total}</span>
            </button>
          );
        })}
      </div>

      {/* 2:1 split — Task list | Detail panel */}
      <div className="grid grid-cols-3 gap-4" style={{ minHeight: 400 }}>
        {/* Left — Task list (2 cols) */}
        <div className="col-span-2 bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-display text-xs font-bold text-foreground">
              {PHASES[activePhase]}
            </h3>
            <span className="text-[10px] text-muted-foreground font-medium">
              {doneCounts[activePhase].done}/{doneCounts[activePhase].total} complete
            </span>
          </div>

          {phaseTasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">No tasks in this phase</div>
          ) : (
            <div className="divide-y divide-border">
              {phaseTasks.map((task) => {
                const done = isDone(task);
                const isSelected = selectedTask === task.id;
                const locked = !p.contractUploaded && task.blocked;

                return (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(isSelected ? null : task.id)}
                    disabled={locked}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-all",
                      isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "border-l-2 border-l-transparent hover:bg-secondary/30",
                      done && "bg-success-muted/30"
                    )}
                  >
                    <div className={cn(
                      "w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                      done ? "bg-success border-success" :
                      locked ? "bg-secondary border-border" : "border-border"
                    )}>
                      {done && <Check className="w-2.5 h-2.5 text-success-foreground" />}
                      {locked && <Lock className="w-2.5 h-2.5 text-muted-foreground/50" />}
                    </div>

                    <span className={cn(
                      "text-xs font-medium flex-1",
                      done ? "text-muted-foreground line-through" : locked ? "text-muted-foreground" : "text-foreground"
                    )}>
                      {task.label}
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className={cn(
                        "text-[9px] font-semibold rounded-full px-1.5 py-0.5",
                        task.type === "legal" ? "text-danger bg-danger-muted" : "text-info bg-info-muted"
                      )}>
                        {task.type === "legal" ? "Legal" : "Suggested"}
                      </span>
                      {task.vaultDoc && <FileText className="w-3 h-3 text-primary" />}
                      {task.hasChat && <MessageSquare className="w-3 h-3 text-success" />}
                      <ChevronRight className={cn("w-3 h-3 text-muted-foreground/40 transition-transform", isSelected && "rotate-90")} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right — Detail panel (1 col) */}
        <div className="col-span-1">
          <AnimatePresence mode="wait">
            {selectedTaskData ? (
              <motion.div
                key={selectedTaskData.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                className="bg-card rounded-xl border border-border p-5 sticky top-4"
              >
                <TaskDetailPanel task={selectedTaskData} done={isDone(selectedTaskData)} locked={!p.contractUploaded && !!selectedTaskData.blocked} />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card rounded-xl border border-border p-5 flex flex-col items-center justify-center text-center h-full min-h-[200px]"
              >
                <ClipboardList className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-xs font-medium text-muted-foreground">Select a task to view details</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Click any task on the left</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Task Detail Panel ─── */
function TaskDetailPanel({ task, done, locked }: { task: TaskItem; done: boolean; locked: boolean }) {
  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0",
          done ? "bg-success border-success" : locked ? "bg-secondary border-border" : "border-border"
        )}>
          {done && <Check className="w-3 h-3 text-success-foreground" />}
          {locked && <Lock className="w-3 h-3 text-muted-foreground/50" />}
        </div>
        <span className={cn(
          "text-[10px] font-semibold rounded-full px-2 py-0.5",
          done ? "text-success bg-success-muted" : locked ? "text-muted-foreground bg-secondary" : "text-primary bg-primary/10"
        )}>
          {done ? "Complete" : locked ? "Locked" : "Pending"}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-display text-sm font-bold text-foreground leading-snug">{task.label}</h4>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className={cn(
          "text-[9px] font-semibold rounded-full px-2 py-0.5",
          task.type === "legal" ? "text-danger bg-danger-muted" : "text-info bg-info-muted"
        )}>
          {task.type === "legal" ? "Legal obligation" : "Recommended"}
        </span>
        {task.vaultDoc && (
          <span className="text-[9px] font-semibold text-primary bg-landlord-light rounded-full px-2 py-0.5">
            Vault doc required
          </span>
        )}
        {task.hasChat && (
          <span className="text-[9px] font-semibold text-success bg-success-muted rounded-full px-2 py-0.5">
            Comms thread
          </span>
        )}
      </div>

      {/* Detail */}
      <p className="text-xs text-muted-foreground leading-relaxed">{task.detail}</p>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border">
        {task.vaultDoc && !done && (
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity">
            <Upload className="w-3.5 h-3.5" />
            Upload document
          </button>
        )}
        {task.hasChat && (
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />
            Open thread
          </button>
        )}
        {!done && !task.vaultDoc && !locked && (
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-success text-success-foreground text-xs font-semibold hover:opacity-90 transition-opacity">
            <Check className="w-3.5 h-3.5" />
            Mark complete
          </button>
        )}
      </div>
    </div>
  );
}
