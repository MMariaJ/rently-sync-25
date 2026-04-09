import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Lock, MessageSquare, AlertTriangle,
  ClipboardList, LogIn, Calendar, PackageOpen, CheckCircle,
  FileText, Upload, ChevronRight, ChevronDown, Eye, EyeOff,
  Filter,
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

// Only show Move-Out and Post-Tenancy if there are incomplete tasks in them
function getVisiblePhases(
  role: string,
  property: Property,
  isDone: (t: TaskItem) => boolean
) {
  return PHASES.map((ph, i) => {
    const tasks = (TASK_DATA[role][ph] || []).filter(
      (t) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || property.isHmo)
    );
    // Always show first 3 phases; only show Move-Out/Post-Tenancy if they have incomplete tasks
    const isLaterPhase = i >= 3;
    const hasIncompleteTasks = tasks.some(t => !isDone(t));
    return {
      phase: ph,
      index: i,
      visible: !isLaterPhase || hasIncompleteTasks,
      tasks,
    };
  }).filter(p => p.visible);
}

export function TasksTab({ property: p, completed, allVaults }: TasksTabProps) {
  const vault = allVaults[p.id] || VAULT_INIT;
  const isDocUp = (n: string) => vault.some(d => d.name === n && d.status === "uploaded");
  const isDone = (t: TaskItem) => !!completed[`${p.id}_${t.id}`] || !!(t.vaultDoc && isDocUp(t.vaultDoc));

  const visiblePhases = getVisiblePhases("landlord", p, isDone);
  
  const [activePhaseIdx, setActivePhaseIdx] = useState(0);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [hideCompleted, setHideCompleted] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "legal" | "suggested">("all");

  const activePhaseData = visiblePhases[activePhaseIdx] || visiblePhases[0];
  const phaseTasks = activePhaseData?.tasks || [];
  
  // Filter tasks
  const filteredTasks = phaseTasks.filter(t => {
    if (hideCompleted && isDone(t)) return false;
    if (filterType !== "all" && t.type !== filterType) return false;
    return true;
  });

  const completedCount = phaseTasks.filter(isDone).length;
  const hiddenCount = phaseTasks.length - filteredTasks.length;

  const doneCounts = visiblePhases.map(({ tasks }) => {
    const done = tasks.filter(isDone).length;
    return { total: tasks.length, done, allDone: tasks.length > 0 && done === tasks.length };
  });

  const selectedTaskData = phaseTasks.find(t => t.id === selectedTask);

  // Statutory obligations — count only
  const obligations = [
    { label: "Deposit protected", met: isDocUp("Deposit Protection Certificate") },
    { label: "Gas Safety", met: isDocUp("Gas Safety Certificate") },
    { label: "Valid EPC", met: isDocUp("EPC Certificate") },
    { label: "EICR valid", met: isDocUp("EICR Report") },
    { label: "How to Rent", met: isDocUp("How to Rent Guide") },
  ];
  const unmetCount = obligations.filter(o => !o.met).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Compact top bar: contract status + obligations as inline badges */}
      <div className="flex items-center gap-3 flex-wrap">
        {p.contractUploaded ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-muted text-success text-[10px] font-semibold">
            <Check className="w-3 h-3" /> Contract active
          </span>
        ) : (
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning-muted text-warning text-[10px] font-semibold hover:bg-warning/20 transition-colors">
            <Lock className="w-3 h-3" /> Upload AST to unlock tasks
          </button>
        )}
        {unmetCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger-muted text-danger text-[10px] font-semibold">
            <AlertTriangle className="w-3 h-3" /> {unmetCount} obligation{unmetCount > 1 ? "s" : ""} pending
          </span>
        )}
        {unmetCount === 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-muted text-success text-[10px] font-semibold">
            <Check className="w-3 h-3" /> All obligations met
          </span>
        )}
      </div>

      {/* Phase navigation bar */}
      <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
        {visiblePhases.map((vp, i) => {
          const Icon = PHASE_ICONS[vp.index];
          const { done, total, allDone } = doneCounts[i];
          const isActive = i === activePhaseIdx;
          return (
            <button
              key={vp.phase}
              onClick={() => { setActivePhaseIdx(i); setSelectedTask(null); }}
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
              <span className="hidden lg:inline">{vp.phase}</span>
              <span className="text-[9px] opacity-60">{done}/{total}</span>
            </button>
          );
        })}
      </div>

      {/* 2:1 split — Task list | Detail panel */}
      <div className="grid grid-cols-3 gap-4" style={{ minHeight: 360 }}>
        {/* Left — Task list (2 cols) */}
        <div className="col-span-2 bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <h3 className="font-display text-xs font-bold text-foreground flex-1">
              {activePhaseData?.phase}
            </h3>

            {/* Filter pills */}
            <div className="flex items-center gap-1">
              {(["all", "legal", "suggested"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={cn(
                    "text-[9px] font-semibold px-2 py-0.5 rounded-full transition-colors capitalize",
                    filterType === f
                      ? f === "legal" ? "bg-danger-muted text-danger" : f === "suggested" ? "bg-info-muted text-info" : "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Hide completed toggle */}
            <button
              onClick={() => setHideCompleted(!hideCompleted)}
              className={cn(
                "flex items-center gap-1 text-[10px] font-medium transition-colors px-2 py-1 rounded-md",
                hideCompleted ? "text-muted-foreground hover:text-foreground" : "text-success bg-success-muted"
              )}
            >
              {hideCompleted ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {hideCompleted ? `${completedCount} done` : "Showing all"}
            </button>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center">
              <Check className="w-6 h-6 text-success mx-auto mb-2" />
              <p className="text-xs font-medium text-muted-foreground">
                {completedCount === phaseTasks.length
                  ? "All tasks complete in this phase"
                  : "No tasks match your filter"}
              </p>
              {hideCompleted && completedCount > 0 && (
                <button
                  onClick={() => setHideCompleted(false)}
                  className="text-[10px] text-primary font-medium mt-2 hover:underline"
                >
                  Show {completedCount} completed task{completedCount > 1 ? "s" : ""}
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTasks.map((task) => {
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
                      done && "opacity-60"
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

      <h4 className="font-display text-sm font-bold text-foreground leading-snug">{task.label}</h4>

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

      <p className="text-xs text-muted-foreground leading-relaxed">{task.detail}</p>

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
