import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Lock, MessageSquare,
  ClipboardList, LogIn, Calendar,
  FileText, Upload, ChevronRight, Eye, EyeOff,
  AlertTriangle,
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

// Only the active tenancy phases (not Move-Out / Post-Tenancy)
const ACTIVE_PHASES = ["Pre-Move-In", "Move-In", "During Tenancy"] as const;
type ActivePhase = typeof ACTIVE_PHASES[number];

const PHASE_META: Record<ActivePhase, { icon: typeof ClipboardList; color: string }> = {
  "Pre-Move-In": { icon: ClipboardList, color: "text-primary" },
  "Move-In": { icon: LogIn, color: "text-info" },
  "During Tenancy": { icon: Calendar, color: "text-success" },
};

export function TasksTab({ property: p, completed, allVaults }: TasksTabProps) {
  const vault = allVaults[p.id] || VAULT_INIT;
  const isDocUp = (n: string) => vault.some(d => d.name === n && d.status === "uploaded");
  const isDone = (t: TaskItem) => !!completed[`${p.id}_${t.id}`] || !!(t.vaultDoc && isDocUp(t.vaultDoc));

  const phaseTasks = (phase: string) =>
    (TASK_DATA["landlord"][phase] || []).filter(
      (t) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || p.isHmo)
    );

  // Find the current active phase (first with incomplete tasks)
  const currentPhase = useMemo(() => {
    for (const ph of ACTIVE_PHASES) {
      const tasks = phaseTasks(ph);
      if (tasks.some(t => !isDone(t))) return ph;
    }
    return "During Tenancy" as ActivePhase; // all done
  }, [p, completed, allVaults]);

  const currentTasks = phaseTasks(currentPhase);
  const pendingTasks = currentTasks.filter(t => !isDone(t));
  const completedTasks = currentTasks.filter(t => isDone(t));

  // Overdue tasks from previous phases
  const overdueTasks = useMemo(() => {
    const currentIdx = ACTIVE_PHASES.indexOf(currentPhase);
    const overdue: { phase: string; task: TaskItem }[] = [];
    for (let i = 0; i < currentIdx; i++) {
      const tasks = phaseTasks(ACTIVE_PHASES[i]);
      tasks.filter(t => !isDone(t)).forEach(t => overdue.push({ phase: ACTIVE_PHASES[i], task: t }));
    }
    return overdue;
  }, [currentPhase, p, completed, allVaults]);

  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const selectedTaskData = currentTasks.find(t => t.id === selectedTask)
    || overdueTasks.find(o => o.task.id === selectedTask)?.task;

  const Icon = PHASE_META[currentPhase].icon;
  const totalActive = pendingTasks.length + overdueTasks.length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Current phase header */}
      <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10", PHASE_META[currentPhase].color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">{currentPhase}</h3>
          <p className="text-[11px] text-muted-foreground">
            {pendingTasks.length} task{pendingTasks.length !== 1 ? "s" : ""} remaining
            {overdueTasks.length > 0 && (
              <span className="text-warning"> · {overdueTasks.length} overdue from earlier</span>
            )}
          </p>
        </div>
        {/* Mini phase indicator */}
        <div className="flex items-center gap-1.5">
          {ACTIVE_PHASES.map((ph) => {
            const tasks = phaseTasks(ph);
            const allDone = tasks.length > 0 && tasks.every(isDone);
            const isCurrent = ph === currentPhase;
            return (
              <div
                key={ph}
                className={cn(
                  "rounded-full transition-all",
                  isCurrent ? "w-6 h-2 bg-primary" :
                  allDone ? "w-2 h-2 bg-success" :
                  "w-2 h-2 bg-border"
                )}
              />
            );
          })}
        </div>
      </div>

      {/* 2:1 split */}
      <div className="grid grid-cols-3 gap-4" style={{ minHeight: 300 }}>
        {/* Left — Task list */}
        <div className="col-span-2 space-y-3">
          {/* Pending tasks */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {pendingTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  done={false}
                  locked={!p.contractUploaded && !!task.blocked}
                  selected={selectedTask === task.id}
                  onSelect={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
                />
              ))}
              {pendingTasks.length === 0 && (
                <div className="p-6 text-center">
                  <Check className="w-5 h-5 text-success mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-muted-foreground">All tasks complete for this phase</p>
                </div>
              )}
            </div>
          </div>

          {/* Overdue from previous phases */}
          {overdueTasks.length > 0 && (
            <div className="bg-card rounded-xl border border-warning/20 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-warning/15 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                <span className="text-[11px] font-semibold text-foreground">Overdue from earlier phases</span>
                <span className="text-[9px] text-warning font-semibold ml-auto">{overdueTasks.length}</span>
              </div>
              <div className="divide-y divide-border/50">
                {overdueTasks.map(({ phase, task }) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    done={false}
                    locked={!p.contractUploaded && !!task.blocked}
                    selected={selectedTask === task.id}
                    onSelect={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
                    phaseLabel={phase}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed — collapsible */}
          {completedTasks.length > 0 && (
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {showCompleted ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {completedTasks.length} completed task{completedTasks.length !== 1 ? "s" : ""}
            </button>
          )}

          <AnimatePresence>
            {showCompleted && completedTasks.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border/50">
                  {completedTasks.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      done={true}
                      locked={false}
                      selected={selectedTask === task.id}
                      onSelect={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Task Row ─── */
function TaskRow({ task, done, locked, selected, onSelect, phaseLabel }: {
  task: TaskItem; done: boolean; locked: boolean; selected: boolean; onSelect: () => void; phaseLabel?: string;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={locked}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-all",
        selected ? "bg-primary/5 border-l-2 border-l-primary" : "border-l-2 border-l-transparent hover:bg-secondary/20",
        done && "opacity-45"
      )}
    >
      <div className={cn(
        "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
        done ? "bg-success border-success" : locked ? "bg-secondary border-border" : "border-border"
      )}>
        {done && <Check className="w-2.5 h-2.5 text-success-foreground" />}
        {locked && <Lock className="w-2.5 h-2.5 text-muted-foreground/50" />}
      </div>

      <div className="flex-1 min-w-0">
        <span className={cn(
          "text-xs font-medium block truncate",
          done ? "text-muted-foreground line-through" : locked ? "text-muted-foreground" : "text-foreground"
        )}>
          {task.label}
        </span>
        {phaseLabel && (
          <span className="text-[9px] text-warning font-medium">{phaseLabel}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className={cn(
          "text-[9px] font-semibold rounded-full px-1.5 py-0.5",
          task.type === "legal" ? "text-danger bg-danger-muted" : "text-info bg-info-muted"
        )}>
          {task.type === "legal" ? "Legal" : "Suggested"}
        </span>
        {task.vaultDoc && <FileText className="w-3 h-3 text-primary/50" />}
        {task.hasChat && <MessageSquare className="w-3 h-3 text-success/50" />}
        <ChevronRight className={cn("w-3 h-3 text-muted-foreground/30 transition-transform", selected && "rotate-90")} />
      </div>
    </button>
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
