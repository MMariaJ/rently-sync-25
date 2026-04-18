import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import {
  Check, Lock, MessageSquare,
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

const ACTIVE_PHASES = ["Pre-Move-In", "Move-In", "During Tenancy"] as const;
type ActivePhase = typeof ACTIVE_PHASES[number];

export function TasksTab({ property: p, completed, allVaults }: TasksTabProps) {
  const vault = allVaults[p.id] || VAULT_INIT;
  const isDocUp = (n: string) => vault.some(d => d.name === n && d.status === "uploaded");
  const isDone = (t: TaskItem) => !!completed[`${p.id}_${t.id}`] || !!(t.vaultDoc && isDocUp(t.vaultDoc));

  const phaseTasks = (phase: string) =>
    (TASK_DATA["landlord"][phase] || []).filter(
      (t) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || p.isHmo)
    );

  const currentPhase = useMemo(() => {
    for (const ph of ACTIVE_PHASES) {
      const tasks = phaseTasks(ph);
      if (tasks.some(t => !isDone(t))) return ph;
    }
    return "During Tenancy" as ActivePhase;
  }, [p, completed, allVaults]);

  const currentTasks = phaseTasks(currentPhase);
  const pendingTasks = currentTasks.filter(t => !isDone(t));
  const completedTasks = currentTasks.filter(t => isDone(t));

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Phase header — flat */}
      <div className="flex items-center justify-between pb-4 hairline-b">
        <div>
          <p className="label-eyebrow mb-1">Current stage</p>
          <h3 className="text-[16px] text-foreground font-medium">{currentPhase}</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5 tabular-nums">
            {pendingTasks.length} task{pendingTasks.length !== 1 ? "s" : ""} remaining
            {overdueTasks.length > 0 && <span className="text-danger"> · {overdueTasks.length} overdue from earlier</span>}
          </p>
        </div>
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
                  isCurrent ? "w-6 h-1.5 bg-primary" :
                  allDone ? "w-1.5 h-1.5 bg-foreground/40" :
                  "w-1.5 h-1.5 bg-border"
                )}
              />
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: 300 }}>
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card hairline rounded-xl overflow-hidden">
            <div>
              {pendingTasks.map((task, idx) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  done={false}
                  locked={!p.contractUploaded && !!task.blocked}
                  selected={selectedTask === task.id}
                  onSelect={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
                  divider={idx > 0}
                />
              ))}
              {pendingTasks.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-[13px] text-muted-foreground">All tasks complete for this stage.</p>
                </div>
              )}
            </div>
          </div>

          {overdueTasks.length > 0 && (
            <div>
              <p className="label-eyebrow mb-2">Overdue from earlier stages</p>
              <div className="bg-card hairline rounded-xl overflow-hidden">
                {overdueTasks.map(({ phase, task }, idx) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    done={false}
                    locked={!p.contractUploaded && !!task.blocked}
                    selected={selectedTask === task.id}
                    onSelect={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
                    phaseLabel={phase}
                    divider={idx > 0}
                  />
                ))}
              </div>
            </div>
          )}

          {completedTasks.length > 0 && (
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {showCompleted ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {completedTasks.length} completed task{completedTasks.length !== 1 ? "s" : ""}
            </button>
          )}

          {showCompleted && completedTasks.length > 0 && (
            <div className="bg-card hairline rounded-xl overflow-hidden">
              {completedTasks.map((task, idx) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  done={true}
                  locked={false}
                  selected={selectedTask === task.id}
                  onSelect={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
                  divider={idx > 0}
                />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          {selectedTaskData ? (
            <div className="bg-card hairline rounded-xl p-5 sticky top-20">
              <TaskDetailPanel task={selectedTaskData} done={isDone(selectedTaskData)} locked={!p.contractUploaded && !!selectedTaskData.blocked} />
            </div>
          ) : (
            <div className="bg-card hairline rounded-xl p-8 text-center">
              <p className="text-[13px] text-muted-foreground">Select a task to see details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, done, locked, selected, onSelect, phaseLabel, divider }: {
  task: TaskItem; done: boolean; locked: boolean; selected: boolean; onSelect: () => void; phaseLabel?: string; divider?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={locked}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
        divider && "hairline-t",
        selected ? "bg-primary/5" : "hover:bg-secondary/50",
        done && "opacity-50"
      )}
    >
      <div className={cn(
        "w-4 h-4 rounded border flex items-center justify-center shrink-0",
        done ? "bg-foreground border-foreground" : locked ? "bg-secondary border-border" : "border-border"
      )}>
        {done && <Check className="w-2.5 h-2.5 text-background" />}
        {locked && <Lock className="w-2.5 h-2.5 text-muted-foreground/60" />}
      </div>

      <div className="flex-1 min-w-0">
        <span className={cn(
          "text-[13px] block truncate",
          done ? "text-muted-foreground line-through" : locked ? "text-muted-foreground" : "text-foreground"
        )}>
          {task.label}
        </span>
        {phaseLabel && (
          <span className="text-[11px] text-muted-foreground">{phaseLabel}</span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 text-[11px]">
        <span className={cn(
          task.type === "legal" ? "text-danger" : "text-muted-foreground"
        )}>
          {task.type === "legal" ? "Legal" : "Suggested"}
        </span>
        {task.vaultDoc && <FileText className="w-3 h-3 text-muted-foreground" />}
        {task.hasChat && <MessageSquare className="w-3 h-3 text-muted-foreground" />}
        <ChevronRight className={cn("w-3 h-3 text-muted-foreground/50 transition-transform", selected && "rotate-90")} />
      </div>
    </button>
  );
}

function TaskDetailPanel({ task, done, locked }: { task: TaskItem; done: boolean; locked: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[11px]">
        <span className={cn(
          "rounded-lg px-2 py-0.5",
          done ? "text-foreground bg-secondary" : locked ? "text-muted-foreground bg-secondary" : "text-primary bg-primary/10"
        )}>
          {done ? "Complete" : locked ? "Locked" : "Pending"}
        </span>
        <span className={cn(task.type === "legal" ? "text-danger" : "text-muted-foreground")}>
          {task.type === "legal" ? "Legal" : "Recommended"}
        </span>
      </div>

      <h4 className="text-[15px] text-foreground font-medium leading-snug">{task.label}</h4>
      <p className="text-[13px] text-muted-foreground leading-relaxed">{task.detail}</p>

      <div className="flex flex-col gap-2 pt-3 hairline-t">
        {task.vaultDoc && !done && (
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity">
            <Upload className="w-3.5 h-3.5" /> Upload document
          </button>
        )}
        {task.hasChat && (
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground text-[13px] font-medium hover:bg-secondary/80 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" /> Open thread
          </button>
        )}
        {!done && !task.vaultDoc && !locked && (
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity">
            <Check className="w-3.5 h-3.5" /> Mark complete
          </button>
        )}
      </div>
    </div>
  );
}
