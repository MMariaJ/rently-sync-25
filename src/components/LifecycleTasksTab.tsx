// Functional, property-driven lifecycle tasks tab.
// Reads task content from the UK-researched TASK_LIBRARY, derives context
// from property + tenant data, and supports local interactivity:
// select rows, toggle checkboxes, stub upload + remind via toast.

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  PORTFOLIO, TENANT_INFO, PROP_CONTRACT, HMO_TENANTS, VAULT_INIT,
  type Property, type VaultDoc,
} from "@/data/constants";
import {
  TASK_LIBRARY, type TaskCtx, type TaskCategory, type TaskAction,
} from "@/data/taskLibrary";
import type { ExtractedFacts } from "@/state/engines";
import { InventoryChecklistModal } from "./InventoryChecklistModal";

const PURPLE = "#534AB7";
const PURPLE_TINT = "#F7F5FD";
const AMBER_TEXT = "#854F0B";
const AMBER_BG = "#FAEEDA";
const RED_DARK = "#791F1F";
const RED_MID = "#A32D2D";
const RED_BORDER = "#F7C1C1";
const RED_BG = "#FDF6F5";

// Tasks that gate the entire stage — when open, they always outrank any
// date-driven task in the urgency ranking. l0 (Upload Tenancy Agreement)
// is the only gate today, but the set makes it easy to add more later.
const GATING_TASK_IDS = new Set(["l0"]);

// === Lifecycle stages =======================================================

export type StageName = "Pre-move-in" | "Move-in" | "Active tenancy" | "Move-out";
const STAGE_ORDER: StageName[] = ["Pre-move-in", "Move-in", "Active tenancy", "Move-out"];

// The stage we treat as the property's "natural" current stage when no
// override is set. p1 starts in Pre-move-in; p2/p3 are mid-tenancy.
export function naturalStage(p: Property): StageName {
  return p.id === "p1" ? "Pre-move-in" : "Active tenancy";
}

interface LifecycleTasksTabProps {
  property: Property;
  completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>;
  taskUploads: Record<string, string>;
  extractedFacts?: Record<string, ExtractedFacts>;
  // Controlled stage — owned by the parent (PropertyOverview) so Prev/Next
  // selections persist when the user switches away and returns to Tasks.
  stage: StageName;
  onStageChange: (stage: StageName) => void;
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

// Per-property tasks broken down by stage. Stages without tasks render an empty
// state but are still navigable so the landlord can preview what's coming.
function tasksForStage(p: Property, stage: StageName): string[] {
  if (p.id === "p1") {
    // l0 (Upload Tenancy Agreement) gates the other pre-move-in work and
    // sits first in the list. Once the AST lands in the Vault it renders as
    // done via the standard upload-action → vault check.
    if (stage === "Pre-move-in") return ["l0", "l1", "l5", "l2", "l3", "l4", "l6", "l7"];
    if (stage === "Move-in") return ["l9", "l8", "l10"];
    if (stage === "Active tenancy") return ["l13", "l22"];
    if (stage === "Move-out") return ["l16", "l17", "l18", "l19"];
    return [];
  }
  if (p.id === "p2") {
    if (stage === "Move-in") return ["l9", "l8", "l10"];
    if (stage === "Active tenancy") return ["l22", "l13", "l12", "l15"];
    if (stage === "Move-out") return ["l16", "l17", "l18", "l19"];
    return [];
  }
  // p3 — HMO
  if (stage === "Move-in") return ["l9", "l8", "l10"];
  if (stage === "Active tenancy") return ["l_hmo1", "l13", "l22", "l12", "l15"];
  if (stage === "Move-out") return ["l16", "l17", "l18", "l19"];
  return [];
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
  property, completed, taskUploads, allVaults, extractedFacts,
  stage, onStageChange,
  onUploadDoc, onMarkTaskDone, onUnmarkTaskDone, onSetReminder,
}: LifecycleTasksTabProps) {
  const ctx = useMemo(() => buildCtx(property), [property]);
  const vault = allVaults[property.id] || VAULT_INIT;

  // Stage is owned by the parent so Prev/Next survives tab switches.
  const stageIdx = STAGE_ORDER.indexOf(stage);

  const taskIds = tasksForStage(property, stage);

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
      // Tie upload tasks to vault state: if the linked doc has been filed
      // (from any surface — vault, comms, tasks), treat the task as done.
      // This keeps Tasks and Vault consistent.
      const uploadAction = lib.actions.find((a) => a.kind === "upload");
      const linkedVaultDoc =
        uploadAction?.kind === "upload" ? uploadAction.vaultDoc : undefined;
      const docFiled =
        !!linkedVaultDoc &&
        vault.some((d) => d.name === linkedVaultDoc && d.status === "uploaded");
      return {
        id,
        title: titleFor(id),
        category: lib.category,
        daysRemaining: days,
        done: isCompleted || hasUpload || docFiled,
        hasDoc: !!uploadAction,
      };
    });
  }, [taskIds, ctx, completed, taskUploads, property.id, vault]);

  // Most urgent: smallest positive days, or any overdue.
  // Exception: gating tasks (l0 — Upload Tenancy Agreement) always win
  // when open, because nothing else can be completed until the contract
  // is filed. Without this, a date-driven task like "How to Rent" would
  // steal the top slot despite being unblockable without the AST.
  const mostUrgent = useMemo(() => {
    const open = resolved.filter((t) => !t.done);
    if (open.length === 0) return null;
    const gate = open.find((t) => GATING_TASK_IDS.has(t.id));
    if (gate) return gate;
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
  const allStageDone = totalCount > 0 && doneCount === totalCount;

  // --- handlers ------------------------------------------------------------

  // When we tick a task that has an associated vaultDoc upload action, also
  // file that doc into the Vault so it shows up under "Filed & current".
  // This means the tick checkbox isn't just bookkeeping — it actually reflects
  // a state change across the property.
  const fileVaultDocForTask = (id: string) => {
    const lib = TASK_LIBRARY[id];
    if (!lib) return false;
    const uploadAction = lib.actions.find((a) => a.kind === "upload");
    if (!uploadAction || uploadAction.kind !== "upload") return false;
    const filename = `${uploadAction.vaultDoc.replace(/\s+/g, "_")}_${property.id}.pdf`;
    onUploadDoc({ propId: property.id, taskId: id, vaultDoc: uploadAction.vaultDoc, filename });
    return true;
  };

  const toggleDone = (id: string) => {
    const wasDone = completed[`${property.id}_${id}`] || !!taskUploads[`${property.id}_${id}`];
    if (wasDone) {
      onUnmarkTaskDone(property.id, id);
      toast("Marked as not done", { description: titleFor(id) });
      return;
    }
    // If this task has a vaultDoc, route through uploadDoc so the doc lands in
    // the Vault as Filed & current and key facts get extracted.
    const filed = fileVaultDocForTask(id);
    if (!filed) {
      onMarkTaskDone(property.id, id, titleFor(id));
    }
  };

  // Inline inventory checklist — opens in the right-hand detail column,
  // not a modal. Only shown for the Move-In Inventory upload.
  const [pendingInventory, setPendingInventory] = useState<{ taskId: string; filename: string } | null>(null);

  const handleAction = (taskId: string, action: TaskAction) => {
    if (action.kind === "upload") {
      const filename = `${action.vaultDoc.replace(/\s+/g, "_")}_${property.id}.pdf`;
      // Inventory uploads must be confirmed item-by-item before filing —
      // shown inline in the right column instead of a pop-up modal.
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

  const goNextStage = () => {
    if (stageIdx < STAGE_ORDER.length - 1) {
      const next = STAGE_ORDER[stageIdx + 1];
      onStageChange(next);
      setSelectedId(null);
      setPendingInventory(null);
      toast.success(`Moved to ${next}`);
    }
  };

  const goPrevStage = () => {
    if (stageIdx > 0) {
      onStageChange(STAGE_ORDER[stageIdx - 1]);
      setSelectedId(null);
      setPendingInventory(null);
    }
  };

  const stageLabel = `${stage} tasks`;

  // --- render --------------------------------------------------------------

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Lifecycle tracker */}
      <LifecycleTracker
        property={property}
        stage={stage}
        doneCount={doneCount}
        totalCount={totalCount}
        mostUrgent={mostUrgent}
        canPrev={stageIdx > 0}
        canNext={stageIdx < STAGE_ORDER.length - 1 && (totalCount === 0 || allStageDone)}
        onPrev={goPrevStage}
        onNext={goNextStage}
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

          {grouped.length === 0 ? (
            <div className="bg-card hairline rounded-xl p-8 text-center">
              <p className="text-[13px] text-muted-foreground">
                No tasks queued for this stage yet.
              </p>
              <p className="text-[12px] text-muted-foreground mt-1" style={{ color: "hsl(var(--muted-foreground) / 0.7)" }}>
                {stageIdx < STAGE_ORDER.length - 1
                  ? `We'll surface ${STAGE_ORDER[stageIdx + 1].toLowerCase()} tasks when relevant.`
                  : "You've reached the end of the lifecycle."}
              </p>
            </div>
          ) : (
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
                      onSelect={() => { setSelectedId(task.id); setPendingInventory(null); }}
                      onToggleDone={() => toggleDone(task.id)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {totalCount > 0 && (
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
          )}
        </section>

        {/* RIGHT — Task detail panel (or inline inventory checklist) */}
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
              extractedFacts={extractedFacts}
              vault={vault}
              propertyId={property.id}
              onAction={(a) => handleAction(effectiveSelected, a)}
            />
          ) : (
            <div className="bg-card hairline rounded-xl p-8 text-center">
              <p className="text-[13px] text-muted-foreground">
                {grouped.length === 0 ? "No task selected." : "Select a task to see details."}
              </p>
            </div>
          )}
        </section>
      </div>

      {pendingInventory && (
        <InventoryChecklistModal
          role="landlord"
          propertyAddress={property.address}
          filename={pendingInventory.filename}
          onClose={() => setPendingInventory(null)}
          onConfirm={({ confirmed, total, issues }) => {
            const { taskId, filename } = pendingInventory;
            onUploadDoc({ propId: property.id, taskId, vaultDoc: "Move-In Inventory", filename });
            setPendingInventory(null);
            if (issues.length > 0) {
              toast.warning(`Filed with ${issues.length} ${issues.length === 1 ? "amendment" : "amendments"}`, {
                description: `${confirmed}/${total} confirmed · amendments logged to evidence trail.`,
              });
            } else {
              toast.success("Inventory confirmed & filed", {
                description: `${confirmed}/${total} items confirmed · ✦ extracted to Vault.`,
              });
            }
          }}
        />
      )}
    </div>
  );
}

// === Lifecycle tracker ======================================================

function LifecycleTracker({
  property, stage, doneCount, totalCount, mostUrgent, canPrev, canNext, onPrev, onNext,
}: {
  property: Property;
  stage: StageName;
  doneCount: number;
  totalCount: number;
  mostUrgent: ResolvedTask | null;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  // Build per-stage display from the task selection so the dots reflect the
  // actual lifecycle. Only the current stage shows an open-task count —
  // other stages keep their label-only so the landlord isn't distracted by
  // work they can't action yet.
  const stages = STAGE_ORDER.map((s) => {
    const ids = tasksForStage(property, s);
    const isCurrent = s === stage;
    const count = isCurrent
      ? ids.length === 0
        ? "—"
        : `${totalCount - doneCount} open`
      : "";
    return { name: s, count, active: isCurrent };
  });

  return (
    <div className="bg-card hairline rounded-xl" style={{ padding: "1.25rem" }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] text-muted-foreground">Your lifecycle tasks</span>
        <span className="text-[12px] text-muted-foreground">
          {totalCount === 0
            ? "Nothing queued in this stage"
            : `${doneCount} of ${totalCount} done · ${totalCount - doneCount} to go`}
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
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-muted-foreground">Most urgent</p>
          <p className="text-[14px] font-medium text-foreground mt-0.5">
            {mostUrgent
              ? `${mostUrgent.title}${mostUrgent.daysRemaining !== null
                  ? ` · ${formatDays(mostUrgent.daysRemaining)}`
                  : ""}`
              : totalCount === 0
                ? "Nothing in this stage"
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
        <div className="flex items-center shrink-0" style={{ gap: "6px" }}>
          <button
            onClick={onPrev}
            disabled={!canPrev}
            className="text-[12px] hairline rounded-lg disabled:opacity-40"
            style={{ padding: "6px 10px", color: "hsl(var(--muted-foreground))" }}
          >
            ← Previous
          </button>
          <button
            onClick={onNext}
            disabled={!canNext}
            className="text-[13px] font-medium rounded-lg text-white disabled:opacity-40"
            style={{ padding: "6px 14px", backgroundColor: PURPLE }}
            title={canNext ? "Move to the next stage" : "Finish current-stage tasks to unlock"}
          >
            Next stage →
          </button>
        </div>
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
  taskId, ctx, uploaded, done, extractedFacts, vault, propertyId, onAction,
}: {
  taskId: string;
  ctx: TaskCtx;
  uploaded?: string;
  done: boolean;
  extractedFacts?: Record<string, ExtractedFacts>;
  vault: VaultDoc[];
  propertyId: string;
  onAction: (a: TaskAction) => void;
}) {
  const lib = TASK_LIBRARY[taskId];
  const days = lib.daysRemaining(ctx);
  const description = lib.description(ctx);
  const consequence = lib.consequence?.(ctx);
  const contextRows = lib.contextRows(ctx);

  // Surface the AI-extracted facts whenever the linked vault doc has been filed —
  // even if the upload happened from elsewhere (e.g. tick the task without an upload,
  // and the doc is already in the vault from a previous upload).
  const uploadAction = lib.actions.find((a) => a.kind === "upload");
  const linkedDocName = uploadAction?.kind === "upload" ? uploadAction.vaultDoc : undefined;
  const linkedDoc = linkedDocName ? vault.find((d) => d.name === linkedDocName) : undefined;
  const filed = linkedDoc?.status === "uploaded";
  const facts = linkedDocName ? extractedFacts?.[`${propertyId}::${linkedDocName}`] : undefined;
  const filedFilename = uploaded ?? (filed && linkedDocName ? `${linkedDocName.replace(/\s+/g, "_")}.pdf` : undefined);

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

      {/* AI-extracted summary — shown as soon as the linked vault doc is filed */}
      {facts && (
        <div
          style={{
            backgroundColor: "#F7F5FD",
            border: `0.5px solid ${PURPLE}33`,
            borderRadius: "8px",
            padding: "10px 12px",
            marginBottom: "16px",
          }}
        >
          <p
            className="font-medium"
            style={{
              fontSize: "11px", color: PURPLE,
              letterSpacing: "0.3px", textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            ✦ Key facts captured
          </p>
          <p style={{ fontSize: "13px", color: "hsl(var(--foreground))", lineHeight: 1.5, marginBottom: facts.fields ? "8px" : 0 }}>
            {facts.summary}
          </p>
          {facts.fields && Object.keys(facts.fields).length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
              {Object.entries(facts.fields).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-2" style={{ fontSize: "12px" }}>
                  <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                  <span className="text-foreground tabular-nums text-right truncate">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* d) If missed */}
      {consequence && !done && (
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
        {filedFilename && (
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
            <span style={{ color: "#3B6D11" }}>📎 Filed</span>
            <span className="tabular-nums truncate" style={{ color: "#3B6D11" }}>{filedFilename}</span>
          </div>
        )}
      </div>

      {/* g) Action stack */}
      <ActionStack actions={lib.actions} onAction={onAction} hasUpload={!!filedFilename} />
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

// (Legacy InlineInventoryChecklist removed — landlord now uses the shared
// InventoryChecklistModal with role="landlord".)

// === Helpers ================================================================

function formatDays(d: number): string {
  if (d === 0) return "Today";
  if (d < 0) return `${Math.abs(d)} days overdue`;
  return `${d} days`;
}

function titleFor(taskId: string): string {
  const titles: Record<string, string> = {
    l0: "Upload Tenancy Agreement",
    l1: "Register deposit with TDP scheme",
    l2: "Upload EPC (min. rating E)",
    l3: "Upload Gas Safety Certificate",
    l4: "Upload EICR (electrical report)",
    l5: "Provide 'How to Rent' guide",
    l6: "Upload property inventory + photos",
    l7: "Set initial meter readings",
    l8: "Hand over keys (log in app)",
    l9: "Evidence smoke & CO alarm check",
    l10: "Countersign move-in inventory",
    l_hmo1: "Upload HMO licence",
    l12: "Respond to repair requests",
    l13: "Renew annual gas safety check",
    l15: "Review & agree rent increase",
    l16: "Complete check-out inspection",
    l17: "Upload damage evidence",
    l18: "Submit itemised deposit deduction",
    l19: "Return deposit within 10 days",
    l22: "Renew EPC certificate",
  };
  return titles[taskId] ?? taskId;
}

// Suppress unused import warning for PORTFOLIO (kept for future expansion)
void PORTFOLIO;
