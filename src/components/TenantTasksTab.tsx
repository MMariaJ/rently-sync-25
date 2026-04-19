// Tenant Tasks tab.
//
// Shape mirrors the landlord LifecycleTasksTab: lifecycle tracker above,
// two-column body below (task list left 1.3fr, detail panel right 1fr).
// Only the current stage's tasks render — no stacked-by-phase groups — and
// the selected task's detail fills the right column.
//
// Current stage comes from TENANCY_INFO[propId].currentPhase in the shared
// data layer. The detail panel reads the new TaskItem fields (unlocks,
// ifIgnored, howItWorks, primaryActionLabel). Cross-role sync lives behind
// `linkedLandlordTaskId` but the store wiring is deliberately out of scope.

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import {
  TASK_DATA, VAULT_INIT, PROP_CONTRACT, TENANT_INFO, TENANCY_INFO,
  LANDLORD_PROFILE,
  type Property, type VaultDoc, type TaskItem, type TenancyPhase,
} from "@/data/constants";
import type { AppActions, ActivityEvent } from "@/state/useAppStore";
import { getTenantTaskDays } from "@/state/tenantEngine";
import { LifecycleTracker, type LifecycleStage } from "./LifecycleTracker";
import { SetupUtilityDialog, type UtilityTaskId } from "./SetupUtilityDialog";
import { InventoryChecklistModal } from "./InventoryChecklistModal";

// Utility-style tasks use the 2-step setup dialog (capture account details
// → connect open banking) instead of a plain "mark complete" toggle.
const UTILITY_TASK_IDS: ReadonlySet<string> = new Set([
  "t_u1", "t_u2", "t_u3", "t_g1",
]);

const PURPLE = "#534AB7";
const PURPLE_TINT = "#F7F5FD";
const PURPLE_BORDER = "#E4E0FA";
const AMBER_TEXT = "#854F0B";
const AMBER_BG = "#FAEEDA";
const RED_DARK = "#791F1F";
const RED_MID = "#A32D2D";
const RED_BG = "#FDF6F5";
const RED_BORDER = "#F7C1C1";
const GREEN_DARK = "#27500A";
const GREEN_BG = "#EAF3DE";

// Tasks that gate the rest of the stage — when open, they always outrank
// any date-driven task in the urgency ranking. t1 (Review & sign tenancy
// agreement) is the gate: nothing downstream works without the signed AST.
const TENANT_GATING_TASK_IDS: ReadonlySet<string> = new Set(["t1"]);

const PHASE_ORDER: TenancyPhase[] = ["Pre-Move-In", "Move-In", "During Tenancy", "Move-Out"];
const PHASE_LABELS: Record<TenancyPhase, string> = {
  "Pre-Move-In": "Pre-move-in",
  "Move-In": "Move-in",
  "During Tenancy": "Active tenancy",
  "Move-Out": "Move-out",
};

interface TenantTasksTabProps {
  property: Property;
  completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>;
  events?: ActivityEvent[];
  // Controlled stage — owned by the parent (TenantHome) so Prev/Next
  // selections persist when the user switches away and returns to Tasks.
  stage: TenancyPhase;
  onStageChange: (phase: TenancyPhase) => void;
  onMarkTaskDone: AppActions["markTaskDone"];
  onUnmarkTaskDone: AppActions["unmarkTaskDone"];
  onSetReminder: AppActions["setReminder"];
  // Hook-up for the "Ask David" secondary action.
  onSwitchToComms?: () => void;
}

// Default Tasks-tab stage for a given tenancy — what the parent should seed
// `stage` state with when it first mounts.
export function defaultTenantStage(propId: string): TenancyPhase {
  return TENANCY_INFO[propId]?.currentPhase ?? "Pre-Move-In";
}

interface ResolvedTask {
  task: TaskItem;
  done: boolean;
  days: number | null;
  subtitle: string;
}

export function TenantTasksTab({
  property, completed, allVaults, events,
  stage, onStageChange,
  onMarkTaskDone, onUnmarkTaskDone, onSetReminder, onSwitchToComms,
}: TenantTasksTabProps) {
  const vault = allVaults[property.id] ?? VAULT_INIT;
  const stageIdx = PHASE_ORDER.indexOf(stage);
  const currentPhase = stage;

  const isDone = (t: TaskItem) =>
    !!completed[`${property.id}_${t.id}`] ||
    (!!t.vaultDoc && vault.some(d => d.name === t.vaultDoc && d.status === "uploaded"));

  // Tasks for the current phase only (no cross-phase grouping on this tab).
  const resolved: ResolvedTask[] = useMemo(() => {
    const phaseTasks = (TASK_DATA.tenant[currentPhase] ?? []).filter(
      t => !t.hmoOnly || property.isHmo,
    );
    return phaseTasks.map(task => {
      const done = isDone(task);
      const days = done ? null : getTenantTaskDays(task.id, property);
      const subtitle = buildSubtitle(task, events, done);
      return { task, done, days, subtitle };
    });
  }, [currentPhase, property, completed, vault, events]);

  // Most-urgent open task — gating tasks (sign AST) always win when open,
  // otherwise the soonest-deadline task surfaces, but only when it's within
  // a week (or overdue). Anything further out isn't "urgent" yet.
  const mostUrgent = useMemo(() => {
    const gate = resolved.find(r => !r.done && TENANT_GATING_TASK_IDS.has(r.task.id));
    if (gate) return gate;
    const dated = resolved.filter(r => !r.done && r.days !== null);
    if (dated.length === 0) return null;
    const soonest = [...dated].sort((a, b) => (a.days! - b.days!))[0];
    return soonest.days! <= 7 ? soonest : null;
  }, [resolved]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const effectiveSelectedId = selectedId ?? mostUrgent?.task.id ?? resolved[0]?.task.id ?? null;
  const selected = resolved.find(r => r.task.id === effectiveSelectedId) ?? null;

  // Utility-task setup dialog. `setupTaskId` also doubles as "is open".
  const [setupTaskId, setSetupTaskId] = useState<UtilityTaskId | null>(null);
  // Inventory checklist modal (task t9). Open when non-null.
  const [inventoryOpen, setInventoryOpen] = useState(false);

  const doneCount = resolved.filter(r => r.done).length;
  const totalCount = resolved.length;
  const openCount = totalCount - doneCount;

  // Per-stage summary for the tracker.
  const stages: LifecycleStage[] = PHASE_ORDER.map(ph => {
    const phaseTasks = (TASK_DATA.tenant[ph] ?? []).filter(t => !t.hmoOnly || property.isHmo);
    const phaseOpen = phaseTasks.filter(t => !isDone(t)).length;
    const isCurrent = ph === currentPhase;
    const count = phaseTasks.length === 0
      ? "—"
      : isCurrent
        ? (phaseOpen === 0 ? "all done" : `${phaseOpen} open`)
        : `${phaseTasks.length} task${phaseTasks.length === 1 ? "" : "s"}`;
    return { name: PHASE_LABELS[ph], count, active: isCurrent };
  });

  const summary = totalCount === 0
    ? "Nothing queued in this stage"
    : `${doneCount} of ${totalCount} done · ${openCount} to go`;

  const canPrev = stageIdx > 0;
  const canNext = stageIdx < PHASE_ORDER.length - 1 && (totalCount === 0 || openCount === 0);

  const goPrev = () => {
    if (!canPrev) return;
    onStageChange(PHASE_ORDER[stageIdx - 1]);
    setSelectedId(null);
  };
  const goNext = () => {
    if (!canNext) return;
    const next = PHASE_ORDER[stageIdx + 1];
    onStageChange(next);
    setSelectedId(null);
    toast.success(`Moved to ${PHASE_LABELS[next]}`);
  };

  const toggleDone = (task: TaskItem) => {
    const key = `${property.id}_${task.id}`;
    const alreadyDone = !!completed[key];
    if (alreadyDone) {
      onUnmarkTaskDone(property.id, task.id);
      toast("Marked as not done", { description: task.label });
    } else {
      onMarkTaskDone(property.id, task.id, task.label);
      toast.success("Task marked complete", { description: task.label });
    }
  };

  // Primary-action click from the detail panel. Utility-style tasks route
  // through the setup dialog (unless already done — then the button just
  // untoggles). The move-in inventory task opens the room-by-room checklist.
  // Everything else stays on the plain toggle.
  const handlePrimary = (task: TaskItem) => {
    const done = !!completed[`${property.id}_${task.id}`];
    if (!done && UTILITY_TASK_IDS.has(task.id)) {
      setSetupTaskId(task.id as UtilityTaskId);
      return;
    }
    if (!done && task.id === "t9") {
      setInventoryOpen(true);
      return;
    }
    toggleDone(task);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <LifecycleTracker
        title="Your tenancy lifecycle"
        summary={summary}
        stages={stages}
        mostUrgent={mostUrgent ? {
          title: mostUrgent.task.label,
          days: mostUrgent.days,
          // Blocking = overdue or ≤ 3 days and part of the hero action.
          blocking: mostUrgent.task.isContractSign
            || (mostUrgent.days !== null && mostUrgent.days <= 3),
        } : null}
        trailing={
          <div className="flex items-center shrink-0" style={{ gap: "6px" }}>
            <button
              onClick={goPrev}
              disabled={!canPrev}
              className="text-[12px] hairline rounded-lg disabled:opacity-40"
              style={{ padding: "6px 10px", color: "hsl(var(--muted-foreground))" }}
            >
              ← Previous
            </button>
            <button
              onClick={goNext}
              disabled={!canNext}
              className="text-[13px] font-medium rounded-lg text-white disabled:opacity-40"
              style={{ padding: "6px 14px", backgroundColor: PURPLE, border: "none" }}
              title={canNext ? "Move to the next stage" : "Finish the open tasks to unlock"}
            >
              Next stage →
            </button>
          </div>
        }
      />

      <div className="grid gap-4" style={{ gridTemplateColumns: "1.3fr 1fr" }}>
        {/* LEFT — task list */}
        <section>
          <div className="flex items-center justify-between" style={{ marginBottom: "10px" }}>
            <h2
              className="font-medium text-muted-foreground"
              style={{ fontSize: "12px", letterSpacing: "0.5px", textTransform: "uppercase" }}
            >
              {PHASE_LABELS[currentPhase]} tasks
            </h2>
            <span className="text-[12px] text-muted-foreground tabular-nums">
              {openCount === 0 ? "All caught up" : `${openCount} open`}
            </span>
          </div>

          {resolved.length === 0 ? (
            <div className="bg-card hairline rounded-xl p-8 text-center">
              <p className="text-[13px] text-muted-foreground">
                No tasks queued for this stage yet.
              </p>
            </div>
          ) : (
            <div className="bg-card hairline rounded-xl overflow-hidden">
              {resolved.map((r, i) => (
                <TaskRow
                  key={r.task.id}
                  task={r.task}
                  subtitle={r.subtitle}
                  days={r.days}
                  done={r.done}
                  selected={r.task.id === effectiveSelectedId}
                  border={i > 0}
                  onSelect={() => setSelectedId(r.task.id)}
                  onToggleDone={() => toggleDone(r.task)}
                />
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

        {/* RIGHT — task detail */}
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

          {selected ? (
            <TaskDetailPanel
              property={property}
              task={selected.task}
              done={selected.done}
              days={selected.days}
              onPrimary={() => handlePrimary(selected.task)}
              onAskDavid={onSwitchToComms}
              onRemind={() => {
                onSetReminder(property.id, selected.task.id, 7);
                toast.success("Reminder set", {
                  description: "We'll nudge you in 7 days.",
                });
              }}
            />
          ) : (
            <div className="bg-card hairline rounded-xl p-8 text-center">
              <p className="text-[13px] text-muted-foreground">
                {resolved.length === 0
                  ? "No task selected."
                  : "Select a task to see details."}
              </p>
            </div>
          )}
        </section>
      </div>

      <SetupUtilityDialog
        open={setupTaskId !== null}
        onOpenChange={(next) => { if (!next) setSetupTaskId(null); }}
        taskId={setupTaskId}
        onComplete={() => {
          if (!setupTaskId) return;
          const task = resolved.find(r => r.task.id === setupTaskId)?.task;
          if (!task) return;
          onMarkTaskDone(property.id, task.id, task.label);
          toast.success("Task marked complete", { description: task.label });
        }}
      />

      {inventoryOpen && (
        <InventoryChecklistModal
          role="tenant"
          propertyAddress={property.address}
          filename="Move-In Inventory"
          onClose={() => setInventoryOpen(false)}
          onConfirm={({ issues }) => {
            setInventoryOpen(false);
            if (issues.length > 0) {
              toast(`${issues.length} issue${issues.length === 1 ? "" : "s"} flagged`, {
                description: "Opening a thread with David.",
              });
              onSwitchToComms?.();
              return;
            }
            const task = resolved.find(r => r.task.id === "t9")?.task;
            if (!task) return;
            onMarkTaskDone(property.id, task.id, task.label);
            toast.success("Inventory confirmed", { description: task.label });
          }}
        />
      )}
    </div>
  );
}

// === Subtitle builder ======================================================
//
// Cross-role context where we have it ("David sent it 2 days ago"), otherwise
// falls back to the task's detail string. Keeps the landlord's action visible
// on the tenant side without relying on a full timeline join.

function buildSubtitle(task: TaskItem, events: ActivityEvent[] | undefined, done: boolean): string {
  if (done) return "Done · filed in your Vault";
  if (task.id === "t1") return `${LANDLORD_PROFILE.name} sent it 2 days ago`;
  if (task.id === "t3") return "Reserved for MyDeposits registration";
  if (task.id === "t8") return "Protects your deposit on the way out";

  // Fallback: if `events` carries an entry linked to this task, surface it.
  // Not yet produced by the store, but keeps the hook in place.
  const recent = events?.find(e => e.title.toLowerCase().includes(task.label.toLowerCase()));
  if (recent) return `${recent.title} · ${recent.date}`;

  return task.detail;
}

// === Task row ==============================================================

function TaskRow({
  task, subtitle, days, done, selected, border, onSelect, onToggleDone,
}: {
  task: TaskItem;
  subtitle: string;
  days: number | null;
  done: boolean;
  selected: boolean;
  border: boolean;
  onSelect: () => void;
  onToggleDone: () => void;
}) {
  const imminent = days !== null && days <= 7;

  return (
    <div
      onClick={onSelect}
      className="flex items-center cursor-pointer transition-colors"
      style={{
        gap: "12px",
        padding: "12px 16px",
        backgroundColor: selected ? PURPLE_TINT : undefined,
        borderLeft: selected ? `3px solid ${PURPLE}` : "3px solid transparent",
        borderTop: border ? "0.5px solid hsl(var(--border))" : undefined,
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
          backgroundColor: done ? "hsl(var(--foreground))" : "hsl(var(--background))",
        }}
        aria-label={done ? "Mark not done" : "Mark done"}
      >
        {done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5l2 2 4-4"
              stroke="white" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-medium truncate"
          style={{
            color: done ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
            textDecoration: done ? "line-through" : undefined,
          }}
        >
          {task.label}
        </p>
        <p
          className="text-[11px] truncate"
          style={{ color: "hsl(var(--muted-foreground) / 0.7)" }}
        >
          {subtitle}
        </p>
      </div>

      {days !== null ? (
        imminent ? (
          <span
            className="shrink-0 tabular-nums"
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: days < 0 ? RED_MID : AMBER_TEXT,
              backgroundColor: days < 0 ? RED_BG : AMBER_BG,
              padding: "3px 8px",
              borderRadius: "8px",
            }}
          >
            {formatDays(days)}
          </span>
        ) : (
          <span className="shrink-0 text-[12px] text-muted-foreground tabular-nums">
            {formatDays(days)}
          </span>
        )
      ) : (
        <span className="shrink-0 text-[12px] text-muted-foreground">—</span>
      )}
    </div>
  );
}

// === Detail panel ==========================================================

function TaskDetailPanel({
  property, task, done, days, onPrimary, onAskDavid, onRemind,
}: {
  property: Property;
  task: TaskItem;
  done: boolean;
  days: number | null;
  onPrimary: () => void;
  onAskDavid?: () => void;
  onRemind: () => void;
}) {
  const contextRows = buildContextRows(property, task);
  const primaryLabel = task.primaryActionLabel
    ?? (done ? "Mark not done" : "Mark complete");

  return (
    <div className="bg-card hairline rounded-xl" style={{ padding: "16px" }}>
      {/* Header row — urgency pill + legal/complete badges */}
      <div className="flex items-center flex-wrap" style={{ gap: "8px", marginBottom: "12px" }}>
        {days !== null && !done && (
          <span
            className="font-medium tabular-nums"
            style={{
              fontSize: "11px",
              color: days < 0 ? RED_MID : AMBER_TEXT,
              backgroundColor: days < 0 ? RED_BG : AMBER_BG,
              padding: "3px 8px",
              borderRadius: "8px",
            }}
          >
            {formatDays(days)}{days < 0 ? "" : " left"}
          </span>
        )}
        {task.type === "legal" && (
          <span className="text-[11px] text-muted-foreground">Legal</span>
        )}
        {done && (
          <span
            className="font-medium"
            style={{
              fontSize: "11px",
              color: GREEN_DARK,
              backgroundColor: GREEN_BG,
              padding: "3px 8px",
              borderRadius: "8px",
            }}
          >
            ✓ Complete
          </span>
        )}
      </div>

      <h3 className="font-medium text-foreground" style={{ fontSize: "16px", marginBottom: "6px" }}>
        {task.label}
      </h3>

      <p
        className="text-muted-foreground"
        style={{ fontSize: "13px", lineHeight: 1.5, marginBottom: "16px" }}
      >
        {task.detail}
      </p>

      {task.unlocks && (
        <InfoBlock
          label="What this unlocks"
          body={task.unlocks}
          textColor={PURPLE}
          bodyColor="hsl(var(--foreground))"
          bg={PURPLE_TINT}
          borderColor={PURPLE_BORDER}
        />
      )}

      {task.ifIgnored && !done && (
        <InfoBlock
          label={task.ifIgnored.label}
          body={task.ifIgnored.body}
          textColor={RED_DARK}
          bodyColor={RED_MID}
          bg={RED_BG}
          borderColor={RED_BORDER}
        />
      )}

      {task.howItWorks && task.howItWorks.length > 0 && (
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
          {task.howItWorks.map((step, i) => (
            <div key={i} className="flex" style={{ gap: "8px", marginBottom: "4px" }}>
              <span
                className="tabular-nums"
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
      )}

      {contextRows.length > 0 && (
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
          {contextRows.map(row => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3"
              style={{ fontSize: "12px", padding: "3px 0" }}
            >
              <span className="text-muted-foreground shrink-0">{row.label}</span>
              <span className="text-foreground tabular-nums text-right">{row.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action stack */}
      <button
        onClick={onPrimary}
        className="w-full font-medium text-white"
        style={{
          backgroundColor: PURPLE,
          border: "none",
          padding: "10px",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "8px",
          cursor: "pointer",
        }}
      >
        {primaryLabel}
      </button>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <button
          onClick={onAskDavid}
          disabled={!onAskDavid}
          className="text-muted-foreground hairline disabled:opacity-50"
          style={{
            backgroundColor: "transparent",
            padding: "8px",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        >
          Ask {LANDLORD_PROFILE.name.split(" ")[0]}
        </button>
        <button
          onClick={onRemind}
          className="text-muted-foreground hairline flex items-center justify-center"
          style={{
            backgroundColor: "transparent",
            padding: "8px",
            borderRadius: "8px",
            fontSize: "12px",
            gap: "6px",
          }}
        >
          <Bell className="w-3 h-3" /> Remind me
        </button>
      </div>
    </div>
  );
}

function InfoBlock({
  label, body, textColor, bodyColor, bg, borderColor,
}: {
  label: string;
  body: string;
  textColor: string;
  bodyColor: string;
  bg: string;
  borderColor: string;
}) {
  return (
    <div
      style={{
        backgroundColor: bg,
        border: `0.5px solid ${borderColor}`,
        borderRadius: "8px",
        padding: "10px 12px",
        marginBottom: "16px",
      }}
    >
      <p
        className="font-medium"
        style={{
          fontSize: "11px", color: textColor,
          letterSpacing: "0.3px", textTransform: "uppercase",
          marginBottom: "4px",
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: "12px", color: bodyColor, lineHeight: 1.5 }}>
        {body}
      </p>
    </div>
  );
}

// === Context rows =========================================================

function buildContextRows(
  property: Property,
  task: TaskItem,
): Array<{ label: string; value: string }> {
  const tenant = TENANT_INFO[property.id];
  const contract = PROP_CONTRACT[property.id];
  const deposit = property.depositAmount ?? property.rent;
  const moveIn = property.moveInDate ?? "—";
  const council = councilForPostcode(property.postcode);
  const waterProvider = waterProviderForPostcode(property.postcode);

  // Utility-style tasks — the generic Landlord/Property/Rent rows aren't
  // useful here (the tenant already knows), so we return a fully
  // task-specific set instead.
  if (task.id === "t_u1") {
    return [
      { label: "Move-in date", value: moveIn },
      { label: "Suggested suppliers", value: "Octopus, EDF, British Gas" },
      { label: "First reading", value: "Capture on move-in day" },
      { label: "Who pays", value: "You (tenant-direct)" },
    ];
  }
  if (task.id === "t_u2") {
    return [
      { label: "Move-in date", value: moveIn },
      { label: "Regional provider", value: waterProvider },
      { label: "Set up via", value: "Provider website or phone" },
      { label: "Who pays", value: "You (tenant-direct)" },
    ];
  }
  if (task.id === "t_u3") {
    return [
      { label: "Move-in date", value: moveIn },
      { label: "Suggested providers", value: "BT, Sky, Virgin Media" },
      { label: "Install lead time", value: "Up to 2 weeks — book early" },
      { label: "Address to quote", value: property.address.split(",")[0] },
    ];
  }
  if (task.id === "t_g1") {
    return [
      { label: "Move-in date", value: moveIn },
      { label: "Local council", value: council },
      { label: "Register within", value: "21 days of move-in" },
      { label: "Liable person", value: tenant?.name ?? "You" },
    ];
  }

  const rows: Array<{ label: string; value: string }> = [
    { label: "Landlord", value: LANDLORD_PROFILE.name },
    { label: "Property", value: property.address.split(",")[0] },
    { label: "Rent", value: `£${property.rent.toLocaleString()} / month` },
  ];

  // Task-specific rows — kept light so the panel stays scannable.
  if (task.id === "t1" && contract) {
    rows.push({ label: "Term", value: `${contract.start} → ${contract.end}` });
    rows.push({ label: "Notice", value: contract.notice });
  }
  if (task.id === "t2" || task.id === "t3") {
    rows.push({
      label: task.id === "t2" ? "Holding amount" : "Deposit",
      value: task.id === "t2"
        ? `£${Math.round(property.rent / 4).toLocaleString()} (1 week)`
        : `£${deposit.toLocaleString()} · ${property.depositScheme ?? "—"}`,
    });
    if (property.paymentRef) {
      rows.push({ label: "Reference", value: property.paymentRef });
    }
  }
  if (task.id === "t6" && property.moveInDate) {
    rows.push({ label: "Move-in date", value: property.moveInDate });
  }
  if (tenant?.email && (task.id === "t1" || task.id === "t5")) {
    rows.push({ label: "Your email", value: tenant.email });
  }

  return rows;
}

// Rough postcode → provider mapping for the prototype. Good enough to make
// the utility tasks feel specific without pulling in a real address lookup.
function councilForPostcode(postcode: string): string {
  const p = postcode.toUpperCase();
  if (p.startsWith("SE4") || p.startsWith("SE13") || p.startsWith("SE14")) return "Lewisham Council";
  if (p.startsWith("SE10") || p.startsWith("SE18")) return "Royal Borough of Greenwich";
  if (p.startsWith("E8") || p.startsWith("E9") || p.startsWith("E5")) return "Hackney Council";
  return "Your local council";
}

function waterProviderForPostcode(postcode: string): string {
  const p = postcode.toUpperCase();
  if (p.startsWith("SE") || p.startsWith("SW") || p.startsWith("N") || p.startsWith("E") || p.startsWith("W"))
    return "Thames Water";
  return "Your regional water company";
}

// === Helpers ==============================================================

function formatDays(d: number): string {
  if (d === 0) return "Today";
  if (d < 0) return `${Math.abs(d)} days overdue`;
  return `${d} days`;
}
