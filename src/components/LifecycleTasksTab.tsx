// Functional, property-driven lifecycle tasks tab.
// Reads task content from the UK-researched TASK_LIBRARY, derives context
// from property + tenant data, and supports local interactivity:
// select rows, toggle checkboxes, stub upload + remind via toast.

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  PORTFOLIO, TENANT_INFO, PROP_CONTRACT, HMO_TENANTS,
  type Property, type VaultDoc,
} from "@/data/constants";
import {
  TASK_LIBRARY, type TaskCtx, type TaskCategory, type TaskAction,
} from "@/data/taskLibrary";
import { InventoryChecklistModal } from "./InventoryChecklistModal";

const PURPLE = "#534AB7";
const PURPLE_TINT = "#F7F5FD";
const AMBER_TEXT = "#854F0B";
const AMBER_BG = "#FAEEDA";
const RED_DARK = "#791F1F";
const RED_MID = "#A32D2D";
const RED_BORDER = "#F7C1C1";
const RED_BG = "#FDF6F5";

interface LifecycleTasksTabProps {
  property: Property;
  completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>;
  taskUploads: Record<string, string>;
  onUploadDoc: (args: { propId: string; taskId: string; vaultDoc: string; filename?: string }) => void;
  onMarkTaskDone: (propId: string, taskId: string, taskTitle: string) => void;
  onUnmarkTaskDone: (propId: string, taskId: string) => void;
  onSetReminder: (propId: string, taskId: string, fireInDays?: number) => void;
}

interface ResolvedTask {
  id: string;
  title: string;
  category: TaskCategory;
  daysRemaining: number | null;
  done: boolean;
  hasDoc: boolean;
}

const CATEGORY_LABEL: Record<TaskCategory, string> = {
  "time-bound-legal": "Time-bound · legal",
  "required-legal": "Required · legal",
  "recommended": "Recommended",
};

const CATEGORY_ORDER: TaskCategory[] = [
  "time-bound-legal",
  "required-legal",
  "recommended",
];

// Per-property task selection. We pick a sensible set per property state.
function tasksForProperty(p: Property): string[] {
  if (p.id === "p1") {
    // 14 Elmwood Road — pre-move-in: full statutory pack
    return ["l1", "l5", "l2", "l3", "l4", "l6", "l7"];
  }
  if (p.id === "p2") {
    // 7 Crane Wharf — active tenancy with expired EPC
    return ["l22", "l13", "l12", "l15"];
  }
  // p3 — HMO Saffron Court — active across 3 ASTs
  return ["l_hmo1", "l13", "l22", "l12", "l15"];
}

// Build the context object from property + tenant data
function buildCtx(p: Property): TaskCtx {
  const tenant = TENANT_INFO[p.id];
  const contract = PROP_CONTRACT[p.id];
  // Deposit cap: 5 weeks for annual rent < £50k, else 6 weeks
  const annualRent = p.rent * 12;
  const weeks = annualRent < 50000 ? 5 : 6;
  const deposit = Math.round((p.rent * 12 / 52) * weeks);

  // For HMOs, we use a representative first tenant for context
  const hmoTenants = HMO_TENANTS[p.id];
  const tenantName = tenant?.name ?? hmoTenants?.[0]?.name ?? "Tenant";
  const tenantFirstName = tenantName.split(" ")[0];

  return {
    tenantName,
    tenantFirstName,
    rent: p.rent,
    deposit,
    contractStart: contract?.start ?? "01 Jan 2026",
    isHmo: !!p.isHmo,
    propertyAddress: p.address,
  };
}

export function LifecycleTasksTab({
  property, completed, taskUploads,
  onUploadDoc, onMarkTaskDone, onUnmarkTaskDone, onSetReminder,
}: LifecycleTasksTabProps) {
  const ctx = useMemo(() => buildCtx(property), [property]);

  const taskIds = tasksForProperty(property);

  // Resolve tasks, decide done state, sort by urgency
  const resolved: ResolvedTask[] = useMemo(() => {
    return taskIds.map((id) => {
      const lib = TASK_LIBRARY[id];
      if (!lib) {
        return { id, title: id, category: "recommended" as TaskCategory, daysRemaining: null, done: false, hasDoc: false };
      }
      const days = lib.daysRemaining(ctx);
      const isCompleted = completed[`${property.id}_${id}`] ?? false;
      const hasUpload = !!taskUploads[`${property.id}_${id}`];
      return {
        id,
        title: titleFor(id),
        category: lib.category,
        daysRemaining: days,
        done: isCompleted || hasUpload,
        hasDoc: lib.actions.some((a) => a.kind === "upload"),
      };
    });
  }, [taskIds, ctx, completed, taskUploads, property.id]);

  // Most urgent: smallest positive days, or any overdue
  const mostUrgent = useMemo(() => {
    const open = resolved.filter((t) => !t.done);
    if (open.length === 0) return null;
    const overdue = open.filter((t) => t.daysRemaining !== null && t.daysRemaining < 0);
    if (overdue.length > 0) {
      return overdue.sort((a, b) => (a.daysRemaining! - b.daysRemaining!))[0];
    }
    const dated = open.filter((t) => t.daysRemaining !== null);
    if (dated.length > 0) {
      return dated.sort((a, b) => (a.daysRemaining! - b.daysRemaining!))[0];
    }
    return open[0];
  }, [resolved]);

  // Default-select most urgent
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const effectiveSelected = selectedId ?? mostUrgent?.id ?? resolved[0]?.id ?? null;

  // Group by category, ordered
  const grouped = useMemo(() => {
    const groups: { category: TaskCategory; tasks: ResolvedTask[] }[] = [];
    for (const cat of CATEGORY_ORDER) {
      const tasks = resolved.filter((t) => t.category === cat);
      if (tasks.length > 0) groups.push({ category: cat, tasks });
    }
    return groups;
  }, [resolved]);

  const doneCount = resolved.filter((t) => t.done).length;
  const totalCount = resolved.length;

  // Stage label used in the lifecycle tracker bottom row
  const stageLabel = property.id === "p1" ? "Pre-move-in tasks" : "Active tenancy tasks";

  // --- handlers ------------------------------------------------------------

  const toggleDone = (id: string) => {
    const wasDone = completed[`${property.id}_${id}`] || !!taskUploads[`${property.id}_${id}`];
    if (wasDone) {
      onUnmarkTaskDone(property.id, id);
      toast("Marked as not done", { description: titleFor(id) });
    } else {
      onMarkTaskDone(property.id, id, titleFor(id));
    }
  };

  const [pendingInventory, setPendingInventory] = useState<{ taskId: string; filename: string } | null>(null);

  const handleAction = (taskId: string, action: TaskAction) => {
    if (action.kind === "upload") {
      const filename = `${action.vaultDoc.replace(/\s+/g, "_")}_${property.id}.pdf`;
      // Inventory uploads must be confirmed item-by-item before filing.
      if (action.vaultDoc === "Move-In Inventory") {
        setPendingInventory({ taskId, filename });
        return;
      }
      onUploadDoc({ propId: property.id, taskId, vaultDoc: action.vaultDoc, filename });
      toast.success("Uploaded · filed in Vault", {
        description: `${action.vaultDoc} · ✦ key facts extracted.`,
      });
    } else if (action.kind === "remind") {
      onSetReminder(property.id, taskId, 7);
      toast("Reminder set", { description: "We'll nudge you 7 days before the deadline." });
    } else if (action.kind === "external") {
      toast("Opening external link", { description: action.href });
    } else if (action.kind === "mark-done") {
      onMarkTaskDone(property.id, taskId, titleFor(taskId));
    }
  };

  // --- render --------------------------------------------------------------

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Lifecycle tracker */}
      <LifecycleTracker
        property={property}
        doneCount={doneCount}
        totalCount={totalCount}
        mostUrgent={mostUrgent}
      />

      {/* Two-column body */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1.3fr 1fr" }}>
        {/* LEFT — Task list */}
        <section>
          <div className="flex items-center justify-between" style={{ marginBottom: "10px" }}>
            <h2
              className="font-medium text-muted-foreground"
              style={{ fontSize: "12px", letterSpacing: "0.5px", textTransform: "uppercase" }}
            >
              {stageLabel}
            </h2>
            <span className="text-[12px] text-muted-foreground">Sort: urgency ▾</span>
          </div>

          <div className="bg-card hairline rounded-xl" style={{ padding: "4px 0" }}>
            {grouped.map((group, gi) => (
              <div
                key={group.category}
                className={gi > 0 ? "hairline-t" : ""}
                style={gi > 0 ? { marginTop: "4px" } : undefined}
              >
                <p
                  className="font-medium"
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    color: "hsl(var(--muted-foreground) / 0.7)",
                    padding: "10px 16px 4px 16px",
                  }}
                >
                  {CATEGORY_LABEL[group.category]}
                </p>

                {group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    selected={task.id === effectiveSelected}
                    onSelect={() => setSelectedId(task.id)}
                    onToggleDone={() => toggleDone(task.id)}
                  />
                ))}
              </div>
            ))}
          </div>

          <p
            className="text-center"
            style={{
              fontSize: "12px",
              color: "hsl(var(--muted-foreground) / 0.7)",
              marginTop: "10px",
            }}
          >
            {doneCount} of {totalCount} done ✦
          </p>
        </section>

        {/* RIGHT — Task detail panel */}
        <section>
          <h2
            className="font-medium text-muted-foreground"
            style={{
              fontSize: "12px", letterSpacing: "0.5px", textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            Task detail
          </h2>

          {effectiveSelected && TASK_LIBRARY[effectiveSelected] ? (
            <TaskDetailPanel
              taskId={effectiveSelected}
              ctx={ctx}
              uploaded={taskUploads[`${property.id}_${effectiveSelected}`]}
              done={resolved.find((t) => t.id === effectiveSelected)?.done ?? false}
              onAction={(a) => handleAction(effectiveSelected, a)}
            />
          ) : (
            <div className="bg-card hairline rounded-xl p-8 text-center">
              <p className="text-[13px] text-muted-foreground">Select a task to see details.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// === Lifecycle tracker ======================================================

function LifecycleTracker({
  property, doneCount, totalCount, mostUrgent,
}: {
  property: Property;
  doneCount: number;
  totalCount: number;
  mostUrgent: ResolvedTask | null;
}) {
  const stages = property.id === "p1"
    ? [
        { name: "Pre-move-in", count: `${totalCount - doneCount} tasks open`, active: true },
        { name: "Move-in", count: "no open tasks", active: false },
        { name: "Active tenancy", count: "ongoing", active: false },
        { name: "Move-out", count: "no open tasks", active: false },
      ]
    : [
        { name: "Pre-move-in", count: "all done", active: false },
        { name: "Move-in", count: "all done", active: false },
        { name: "Active tenancy", count: `${totalCount - doneCount} open`, active: true },
        { name: "Move-out", count: "no open tasks", active: false },
      ];

  return (
    <div className="bg-card hairline rounded-xl" style={{ padding: "1.25rem" }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] text-muted-foreground">Your lifecycle tasks</span>
        <span className="text-[12px] text-muted-foreground">
          {doneCount} of {totalCount} done · {totalCount - doneCount} to go
        </span>
      </div>

      <div className="flex" style={{ gap: "8px" }}>
        {stages.map((s) => (
          <div key={s.name} className="flex-1 flex flex-col" style={{ gap: "6px" }}>
            <div
              style={{
                height: "4px",
                borderRadius: "2px",
                backgroundColor: s.active ? PURPLE : "hsl(var(--border))",
              }}
            />
            <span
              className="text-[12px]"
              style={{
                color: s.active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                fontWeight: s.active ? 500 : 400,
              }}
            >
              {s.name}
            </span>
            <span
              className="text-[11px]"
              style={{
                color: s.active
                  ? "hsl(var(--muted-foreground))"
                  : "hsl(var(--muted-foreground) / 0.7)",
              }}
            >
              {s.count}
            </span>
          </div>
        ))}
      </div>

      <div
        className="hairline-t flex items-center justify-between gap-3"
        style={{ marginTop: "14px", paddingTop: "14px" }}
      >
        <div className="min-w-0">
          <p className="text-[12px] text-muted-foreground">Most urgent</p>
          <p className="text-[14px] font-medium text-foreground mt-0.5">
            {mostUrgent
              ? `${mostUrgent.title}${mostUrgent.daysRemaining !== null
                  ? ` · ${formatDays(mostUrgent.daysRemaining)}`
                  : ""}`
              : "All caught up"}
          </p>
        </div>
        {mostUrgent && TASK_LIBRARY[mostUrgent.id]?.statutory && (
          <span
            className="shrink-0 font-medium"
            style={{
              fontSize: "11px",
              color: AMBER_TEXT,
              backgroundColor: AMBER_BG,
              padding: "3px 8px",
              borderRadius: "8px",
            }}
          >
            Statutory · {mostUrgent.daysRemaining !== null ? `${Math.abs(mostUrgent.daysRemaining)}-day window` : "ongoing"}
          </span>
        )}
      </div>
    </div>
  );
}

// === Task row ===============================================================

function TaskRow({ task, selected, onSelect, onToggleDone }: {
  task: ResolvedTask;
  selected: boolean;
  onSelect: () => void;
  onToggleDone: () => void;
}) {
  const lib = TASK_LIBRARY[task.id];
  const subtitle = lib?.subtitle ?? "";
  const daysPill = task.daysRemaining !== null;

  return (
    <div
      onClick={onSelect}
      className="flex items-center cursor-pointer transition-colors"
      style={{
        gap: "12px",
        padding: "10px 16px",
        backgroundColor: selected ? PURPLE_TINT : undefined,
        borderLeft: selected ? `3px solid ${PURPLE}` : "3px solid transparent",
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggleDone(); }}
        className="shrink-0 flex items-center justify-center transition-colors"
        style={{
          width: "16px",
          height: "16px",
          border: "0.5px solid hsl(var(--border))",
          borderRadius: "3px",
          backgroundColor: task.done ? "hsl(var(--foreground))" : "hsl(var(--background))",
        }}
        aria-label={task.done ? "Mark not done" : "Mark done"}
      >
        {task.done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-medium truncate"
          style={{
            color: task.done ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
            textDecoration: task.done ? "line-through" : undefined,
          }}
        >
          {task.title}
        </p>
        <p
          className="text-[11px] truncate"
          style={{ color: "hsl(var(--muted-foreground) / 0.7)" }}
        >
          {subtitle}
        </p>
      </div>

      {daysPill ? (
        <span
          className="shrink-0"
          style={{
            fontSize: "11px",
            color: task.daysRemaining! < 0 ? RED_MID : AMBER_TEXT,
            backgroundColor: task.daysRemaining! < 0 ? RED_BG : AMBER_BG,
            padding: "3px 8px",
            borderRadius: "8px",
          }}
        >
          {formatDays(task.daysRemaining!)}
        </span>
      ) : (
        <span className="shrink-0 text-[12px] text-muted-foreground tabular-nums">—</span>
      )}
    </div>
  );
}

// === Detail panel ===========================================================

function TaskDetailPanel({
  taskId, ctx, uploaded, done, onAction,
}: {
  taskId: string;
  ctx: TaskCtx;
  uploaded?: string;
  done: boolean;
  onAction: (a: TaskAction) => void;
}) {
  const lib = TASK_LIBRARY[taskId];
  const days = lib.daysRemaining(ctx);
  const description = lib.description(ctx);
  const consequence = lib.consequence?.(ctx);
  const contextRows = lib.contextRows(ctx);

  return (
    <div className="bg-card hairline rounded-xl" style={{ padding: "16px" }}>
      {/* a) Header row */}
      <div className="flex items-center" style={{ gap: "8px", marginBottom: "12px" }}>
        {days !== null && (
          <span
            className="font-medium"
            style={{
              fontSize: "11px",
              color: days < 0 ? RED_MID : AMBER_TEXT,
              backgroundColor: days < 0 ? RED_BG : AMBER_BG,
              padding: "3px 8px",
              borderRadius: "8px",
            }}
          >
            {formatDays(days)} {days < 0 ? "" : "left"}
          </span>
        )}
        {lib.statutory && (
          <span className="text-[11px] text-muted-foreground">Statutory</span>
        )}
        {done && (
          <span
            className="font-medium"
            style={{
              fontSize: "11px",
              color: "#3B6D11",
              backgroundColor: "#EAF3DE",
              padding: "3px 8px",
              borderRadius: "8px",
            }}
          >
            ✓ Complete
          </span>
        )}
      </div>

      {/* b) Title */}
      <h3
        className="font-medium text-foreground"
        style={{ fontSize: "16px", marginBottom: "6px" }}
      >
        {titleFor(taskId)}
      </h3>

      {/* c) Description */}
      <p
        className="text-muted-foreground"
        style={{ fontSize: "13px", lineHeight: 1.5, marginBottom: "16px" }}
      >
        {description}
      </p>

      {/* d) If missed */}
      {consequence && (
        <div
          style={{
            backgroundColor: RED_BG,
            border: `0.5px solid ${RED_BORDER}`,
            borderRadius: "8px",
            padding: "10px 12px",
            marginBottom: "16px",
          }}
        >
          <p
            className="font-medium"
            style={{
              fontSize: "11px", color: RED_DARK,
              letterSpacing: "0.3px", textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            If missed
          </p>
          <p style={{ fontSize: "12px", color: RED_MID, lineHeight: 1.5 }}>
            {consequence}
          </p>
        </div>
      )}

      {/* e) How this works */}
      <div style={{ marginBottom: "16px" }}>
        <p
          style={{
            fontSize: "11px",
            color: "hsl(var(--muted-foreground) / 0.7)",
            letterSpacing: "0.5px", textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          How this works
        </p>
        {lib.steps.map((step, i) => (
          <div key={i} className="flex" style={{ gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                fontSize: "12px",
                color: "hsl(var(--muted-foreground) / 0.7)",
                lineHeight: 1.6,
              }}
            >
              {i + 1}.
            </span>
            <span
              className="text-muted-foreground"
              style={{ fontSize: "12px", lineHeight: 1.6 }}
            >
              {step}
            </span>
          </div>
        ))}
      </div>

      {/* f) Context */}
      <div style={{ marginBottom: "16px" }}>
        <p
          style={{
            fontSize: "11px",
            color: "hsl(var(--muted-foreground) / 0.7)",
            letterSpacing: "0.5px", textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          Context
        </p>
        {contextRows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-3"
            style={{ fontSize: "12px", padding: "3px 0" }}
          >
            <span className="text-muted-foreground shrink-0">{r.label}</span>
            <span className="text-foreground tabular-nums text-right">{r.value}</span>
          </div>
        ))}
        {uploaded && (
          <div
            className="flex items-center justify-between gap-3"
            style={{
              fontSize: "12px",
              padding: "6px 8px",
              marginTop: "6px",
              backgroundColor: "#EAF3DE",
              borderRadius: "6px",
            }}
          >
            <span style={{ color: "#3B6D11" }}>📎 Attached</span>
            <span className="tabular-nums" style={{ color: "#3B6D11" }}>{uploaded}</span>
          </div>
        )}
      </div>

      {/* g) Action stack */}
      <ActionStack actions={lib.actions} onAction={onAction} hasUpload={!!uploaded} />
    </div>
  );
}

function ActionStack({
  actions, onAction, hasUpload,
}: {
  actions: TaskAction[];
  onAction: (a: TaskAction) => void;
  hasUpload: boolean;
}) {
  const primary = actions[0];
  const secondaries = actions.slice(1);

  const renderPrimary = () => {
    if (!primary) return null;
    const label = primary.kind === "upload" && hasUpload
      ? "Replace upload"
      : primary.label;
    return (
      <button
        onClick={() => onAction(primary)}
        className="w-full font-medium text-white"
        style={{
          backgroundColor: PURPLE,
          border: "none",
          padding: "10px",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: secondaries.length > 0 ? "8px" : 0,
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      {renderPrimary()}
      {secondaries.length > 0 && (
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${Math.min(secondaries.length, 2)}, 1fr)`,
            gap: "8px",
          }}
        >
          {secondaries.slice(0, 2).map((a, i) => (
            <button
              key={i}
              onClick={() => onAction(a)}
              className="text-muted-foreground hairline"
              style={{
                backgroundColor: "transparent",
                padding: "8px",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// === Helpers ================================================================

function formatDays(d: number): string {
  if (d === 0) return "Today";
  if (d < 0) return `${Math.abs(d)} days overdue`;
  return `${d} days`;
}

function titleFor(taskId: string): string {
  const titles: Record<string, string> = {
    l1: "Register deposit with TDP scheme",
    l2: "Upload EPC (min. rating E)",
    l3: "Upload Gas Safety Certificate",
    l4: "Upload EICR (electrical report)",
    l5: "Provide 'How to Rent' guide",
    l6: "Upload property inventory + photos",
    l7: "Set initial meter readings",
    l_hmo1: "Upload HMO licence",
    l12: "Respond to repair requests",
    l13: "Renew annual gas safety check",
    l15: "Review & agree rent increase",
    l22: "Renew EPC certificate",
  };
  return titles[taskId] ?? taskId;
}

// Suppress unused import warning for PORTFOLIO (kept for future expansion)
void PORTFOLIO;
