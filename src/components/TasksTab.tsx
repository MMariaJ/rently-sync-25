import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Lock, MessageSquare,
  ClipboardList, LogIn, Calendar, PackageOpen, CheckCircle,
  FileText, Upload, ChevronRight, Eye, EyeOff,
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

function getVisiblePhases(property: Property, isDone: (t: TaskItem) => boolean) {
  return PHASES.map((ph, i) => {
    const tasks = (TASK_DATA["landlord"][ph] || []).filter(
      (t) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || property.isHmo)
    );
    const isLaterPhase = i >= 3;
    const hasIncompleteTasks = tasks.some(t => !isDone(t));
    return { phase: ph, index: i, visible: !isLaterPhase || hasIncompleteTasks, tasks };
  }).filter(p => p.visible);
}

export function TasksTab({ property: p, completed, allVaults }: TasksTabProps) {
  const vault = allVaults[p.id] || VAULT_INIT;
  const isDocUp = (n: string) => vault.some(d => d.name === n && d.status === "uploaded");
  const isDone = (t: TaskItem) => !!completed[`${p.id}_${t.id}`] || !!(t.vaultDoc && isDocUp(t.vaultDoc));

  const visiblePhases = getVisiblePhases(p, isDone);

  // Find first phase with incomplete tasks
  const currentPhaseVIdx = visiblePhases.findIndex(vp => vp.tasks.some(t => !isDone(t)));

  const [activePhaseIdx, setActivePhaseIdx] = useState(Math.max(currentPhaseVIdx, 0));
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [hideCompleted, setHideCompleted] = useState(true);

  const activePhaseData = visiblePhases[activePhaseIdx] || visiblePhases[0];
  const phaseTasks = activePhaseData?.tasks || [];

  const filteredTasks = phaseTasks.filter(t => {
    if (hideCompleted && isDone(t)) return false;
    return true;
  });

  const completedCount = phaseTasks.filter(isDone).length;

  const doneCounts = visiblePhases.map(({ tasks }) => {
    const done = tasks.filter(isDone).length;
    return { total: tasks.length, done, allDone: tasks.length > 0 && done === tasks.length };
  });

  const selectedTaskData = phaseTasks.find(t => t.id === selectedTask);

  // Total progress
  const totalTasks = visiblePhases.reduce((s, vp) => s + vp.tasks.length, 0);
  const totalDone = visiblePhases.reduce((s, vp) => s + vp.tasks.filter(isDone).length, 0);
  const progressPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Phase stepper — visual journey */}
      <div className="bg-card rounded-xl border border-border p-5">
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-foreground">Tenancy progress</span>
          <span className="text-[11px] text-muted-foreground font-medium">{totalDone}/{totalTasks} tasks · {progressPct}%</span>
        </div>

        <div className="relative mb-6">
          {/* Track */}
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>

          {/* Phase dots on the track */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-1">
            {visiblePhases.map((vp, i) => {
              const { allDone } = doneCounts[i];
              const isCurrent = i === activePhaseIdx;
              const isPast = i < (currentPhaseVIdx >= 0 ? currentPhaseVIdx : 0);
              return (
                <button
                  key={vp.phase}
                  onClick={() => { setActivePhaseIdx(i); setSelectedTask(null); }}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all bg-card",
                    allDone ? "border-success bg-success" :
                    isCurrent ? "border-primary ring-4 ring-primary/10" :
                    isPast ? "border-primary" : "border-border"
                  )}
                >
                  {allDone && <Check className="w-2.5 h-2.5 text-success-foreground" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Phase labels */}
        <div className="flex justify-between">
          {visiblePhases.map((vp, i) => {
            const Icon = PHASE_ICONS[vp.index];
            const { done, total, allDone } = doneCounts[i];
            const isCurrent = i === activePhaseIdx;
            return (
              <button
                key={vp.phase}
                onClick={() => { setActivePhaseIdx(i); setSelectedTask(null); }}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all group",
                  isCurrent ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", allDone ? "text-success" : isCurrent ? "text-primary" : "")} />
                <span className={cn("text-[10px] font-medium leading-tight text-center", isCurrent && "font-semibold")}>
                  {vp.phase}
                </span>
                <span className="text-[9px] opacity-60">{done}/{total}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2:1 split — Task list | Detail panel */}
      <div className="grid grid-cols-3 gap-4" style={{ minHeight: 320 }}>
        {/* Left — Task list */}
        <div className="col-span-2 bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <h3 className="font-display text-xs font-bold text-foreground flex-1">
              {activePhaseData?.phase}
            </h3>

            {/* Hide completed toggle */}
            {completedCount > 0 && (
              <button
                onClick={() => setHideCompleted(!hideCompleted)}
                className={cn(
                  "flex items-center gap-1 text-[10px] font-medium transition-colors px-2 py-1 rounded-md",
                  hideCompleted ? "text-muted-foreground hover:text-foreground" : "text-success bg-success-muted"
                )}
              >
                {hideCompleted ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {hideCompleted ? `${completedCount} hidden` : "All shown"}
              </button>
            )}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center">
              <Check className="w-6 h-6 text-success mx-auto mb-2" />
              <p className="text-xs font-medium text-muted-foreground">
                {completedCount === phaseTasks.length ? "All tasks complete" : "No pending tasks"}
              </p>
              {hideCompleted && completedCount > 0 && (
                <button
                  onClick={() => setHideCompleted(false)}
                  className="text-[10px] text-primary font-medium mt-2 hover:underline"
                >
                  Show {completedCount} completed
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
                      done && "opacity-50"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
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

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={cn(
                        "text-[9px] font-semibold rounded-full px-1.5 py-0.5",
                        task.type === "legal" ? "text-danger bg-danger-muted" : "text-info bg-info-muted"
                      )}>
                        {task.type === "legal" ? "Legal" : "Suggested"}
                      </span>
                      {task.vaultDoc && <FileText className="w-3 h-3 text-primary/60" />}
                      {task.hasChat && <MessageSquare className="w-3 h-3 text-success/60" />}
                      <ChevronRight className={cn("w-3 h-3 text-muted-foreground/30 transition-transform", isSelected && "rotate-90")} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right — Detail panel */}
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
                <ClipboardList className="w-8 h-8 text-muted-foreground/20 mb-3" />
                <p className="text-xs font-medium text-muted-foreground">Select a task</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">Click any item on the left</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Detail Panel ─── */
function TaskDetailPanel({ task, done, locked }: { task: TaskItem; done: boolean; locked: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-[10px] font-semibold rounded-full px-2 py-0.5",
          done ? "text-success bg-success-muted" : locked ? "text-muted-foreground bg-secondary" : "text-primary bg-primary/10"
        )}>
          {done ? "Complete" : locked ? "Locked" : "Pending"}
        </span>
        <span className={cn(
          "text-[9px] font-semibold rounded-full px-1.5 py-0.5",
          task.type === "legal" ? "text-danger bg-danger-muted" : "text-info bg-info-muted"
        )}>
          {task.type === "legal" ? "Legal" : "Recommended"}
        </span>
      </div>

      <h4 className="font-display text-sm font-bold text-foreground leading-snug">{task.label}</h4>

      <p className="text-xs text-muted-foreground leading-relaxed">{task.detail}</p>

      {(task.vaultDoc || task.hasChat) && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {task.vaultDoc && (
            <span className="text-[9px] font-medium text-primary bg-primary/5 rounded-full px-2 py-0.5 flex items-center gap-1">
              <FileText className="w-2.5 h-2.5" /> Vault document
            </span>
          )}
          {task.hasChat && (
            <span className="text-[9px] font-medium text-success bg-success-muted rounded-full px-2 py-0.5 flex items-center gap-1">
              <MessageSquare className="w-2.5 h-2.5" /> Comms thread
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-2 border-t border-border">
        {task.vaultDoc && !done && (
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity">
            <Upload className="w-3.5 h-3.5" /> Upload document
          </button>
        )}
        {task.hasChat && (
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" /> Open thread
          </button>
        )}
        {!done && !task.vaultDoc && !locked && (
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-success text-success-foreground text-xs font-semibold hover:opacity-90 transition-opacity">
            <Check className="w-3.5 h-3.5" /> Mark complete
          </button>
        )}
      </div>
    </div>
  );
}
