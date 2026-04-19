// Tenant-side derived state.
//
// Mirrors engines.ts but reads TASK_DATA["tenant"] instead of landlord.
// Also exposes a tenant-flavoured hero builder so the Overview matches the
// landlord page in shape (headline / subline / cta / tone) but speaks to the
// things a tenant actually cares about: rent, deposit, repairs, move-in tasks.

import {
  TASK_DATA, VAULT_INIT, DOC_VALIDITY_BY_PROP, TENANCY_INFO,
  type Property, type VaultDoc, type TaskItem,
} from "@/data/constants";
import type { LifecyclePhase } from "./engines";

const ACTIVE_PHASES: LifecyclePhase[] = ["Pre-Move-In", "Move-In", "During Tenancy", "Move-Out"];
const PRE_MOVEIN_PHASES: LifecyclePhase[] = ["Pre-Move-In", "Move-In"];

function isDoneFor(propId: string, completed: Record<string, boolean>, vault: VaultDoc[]) {
  const isDocUp = (n: string) => vault.some(d => d.name === n && d.status === "uploaded");
  return (t: TaskItem) =>
    !!completed[`${propId}_${t.id}`] || (!!t.vaultDoc && isDocUp(t.vaultDoc));
}

// The tenancy-agreement signing task (`isContractSign`) is the most
// important pre-move-in action, so it counts like any other open task.
function tasksInPhase(phase: LifecyclePhase): TaskItem[] {
  return TASK_DATA.tenant[phase] ?? [];
}

export function getTenantPhase(
  property: Property,
  completed: Record<string, boolean>,
  vaults: Record<string, VaultDoc[]>,
): LifecyclePhase {
  const vault = vaults[property.id] ?? VAULT_INIT;
  const isDone = isDoneFor(property.id, completed, vault);

  const declared = TENANCY_INFO[property.id]?.currentPhase ?? "Pre-Move-In";
  const baseIdx = Math.max(0, ACTIVE_PHASES.indexOf(declared));

  for (let i = baseIdx; i < ACTIVE_PHASES.length; i++) {
    const ph = ACTIVE_PHASES[i];
    const tasks = tasksInPhase(ph);
    const hasOpen = tasks.some(t => !isDone(t));
    if (hasOpen) return ph;

    const next = ACTIVE_PHASES[i + 1];
    if (!next) return ph;

    // Normal phase transitions (Pre-Move-In → Move-In → During Tenancy)
    // advance as soon as the current phase is complete. The exception is
    // During Tenancy → Move-Out: we don't auto-advance there because the
    // Move-Out catalogue always exists as "future work", and we only want
    // to shift the tenancy to "Moving out" once the tenant has actually
    // started those actions (served notice, etc.).
    if (ph === "During Tenancy" && !tasksInPhase(next).some(t => isDone(t))) {
      return ph;
    }
  }
  return ACTIVE_PHASES[ACTIVE_PHASES.length - 1];
}

export function getTenantPhaseProgress(
  property: Property,
  completed: Record<string, boolean>,
  vaults: Record<string, VaultDoc[]>,
): Record<LifecyclePhase, { open: number; done: number }> {
  const vault = vaults[property.id] ?? VAULT_INIT;
  const isDone = isDoneFor(property.id, completed, vault);
  const out = {} as Record<LifecyclePhase, { open: number; done: number }>;
  for (const ph of ACTIVE_PHASES) {
    const tasks = tasksInPhase(ph);
    const done = tasks.filter(isDone).length;
    out[ph] = { open: tasks.length - done, done };
  }
  return out;
}

// Tenant-flavoured hero. Same shape as the landlord overview hero so the
// PropertyOverview render path can be reused.
export interface TenantHero {
  headline: string;
  subline: string;
  cta: string;
  tone?: "danger" | "neutral";
}

export function buildTenantHero(
  property: Property,
  completed: Record<string, boolean>,
  vaults: Record<string, VaultDoc[]>,
): TenantHero {
  const phase = getTenantPhase(property, completed, vaults);

  // Late rent → strongest signal for the tenant.
  if (property.paymentStatus === "late") {
    return {
      headline: `Rent is ${property.daysLate ?? 1} days late`,
      subline: `Pay £${property.rent.toLocaleString()} now to avoid arrears interest. Reference ${property.paymentRef ?? "—"}.`,
      cta: "Pay rent",
    };
  }

  if (phase === "Pre-Move-In") {
    const vault = vaults[property.id] ?? VAULT_INIT;
    const isDone = isDoneFor(property.id, completed, vault);
    const preMoveInTasks = TASK_DATA.tenant["Pre-Move-In"] ?? [];
    const signTask = preMoveInTasks.find(t => t.id === "t1");

    // Signing the tenancy is the canonical pre-move-in headline while it's
    // still open. Once it's ticked we fall through to whatever's next —
    // otherwise the banner keeps shouting "sign your agreement" at a user
    // who already signed.
    if (signTask && !isDone(signTask)) {
      return {
        headline: "Sign your tenancy agreement to lock in move-in",
        subline: "Once signed, your deposit can be protected and keys arranged.",
        cta: "Review & sign",
      };
    }

    const today = new Date();
    const openWithDays = preMoveInTasks
      .filter(t => !isDone(t))
      .map(t => ({ task: t, days: getTenantTaskDays(t.id, property, today) }));
    const dated = openWithDays.filter(
      (o): o is { task: TaskItem; days: number } => o.days !== null,
    );
    const blocker = dated.sort((a, b) => a.days - b.days)[0]?.task
      ?? openWithDays[0]?.task;

    if (blocker) {
      return {
        headline: blocker.label,
        subline: blocker.unlocks ?? blocker.detail,
        cta: blocker.primaryActionLabel ?? "Open task",
      };
    }
  }

  if (phase === "Move-In") {
    return {
      headline: "Confirm your move-in inventory within 7 days",
      subline: "Photo evidence today protects your deposit on the way out.",
      cta: "Open inventory",
      tone: "neutral",
    };
  }

  if (property.paymentStatus === "upcoming") {
    return {
      headline: `Rent £${property.rent.toLocaleString()} due on ${property.dueDate ?? "—"}`,
      subline: `Use reference ${property.paymentRef ?? "—"} so payment is matched automatically.`,
      cta: "View payment details",
      tone: "neutral",
    };
  }

  return {
    headline: "All up to date — nothing needs your attention",
    subline: "We'll nudge you a week before your next rent payment is due.",
    cta: "View tasks",
    tone: "neutral",
  };
}

// === Pre-move-in progress counts ===========================================
//
// Three-segment progress bar for the tenant dashboard: done / needs-you /
// upcoming. "Needs you" is the currently-blocking task (the one surfaced in
// the hero); everything else not done is "upcoming".

export interface MoveInProgress {
  done: number;
  needsYou: number;
  upcoming: number;
  total: number;
}

// Imminence threshold: a task is "needs you" when its deadline is this many
// days away or sooner. Everything further out sits in "upcoming".
const NEEDS_YOU_DAYS = 7;

export function getMoveInProgress(
  property: Property,
  completed: Record<string, boolean>,
  vaults: Record<string, VaultDoc[]>,
  today: Date = new Date(),
): MoveInProgress {
  const vault = vaults[property.id] ?? VAULT_INIT;
  const isDone = isDoneFor(property.id, completed, vault);
  // Scope the progress bar to the tenant's current lifecycle phase so the
  // card answers "what's left in this stage?" — not an aggregate across
  // every future stage, which feels perpetually unfinished.
  const phase = getTenantPhase(property, completed, vaults);
  const tasks = tasksInPhase(phase);
  const done = tasks.filter(isDone).length;
  // "Needs you" counts open tasks with a known deadline within a week. Tasks
  // further out (or with no fixed deadline) sit in "upcoming" — so once the
  // last imminent task is ticked, the bar relaxes instead of flagging
  // anything that's weeks away.
  let needsYou = 0;
  let upcoming = 0;
  for (const t of tasks) {
    if (isDone(t)) continue;
    const d = getTenantTaskDays(t.id, property, today);
    if (d !== null && d <= NEEDS_YOU_DAYS) needsYou++;
    else upcoming++;
  }
  return { done, needsYou, upcoming, total: tasks.length };
}

// === Safety check summary (cross-role sync) =================================
//
// The tenant's "Safety checks" line reads "all current ✦" when the three
// core compliance certs (EPC, Gas Safety, EICR) have a non-expired record.
// These certs are uploaded by the landlord on their side of the product;
// this selector is how the landlord's Vault state surfaces for the tenant.

export function getSafetyStatus(property: Property): "all-current" | "action-needed" {
  const validity = DOC_VALIDITY_BY_PROP[property.id] ?? {};
  const core = ["Gas Safety Certificate", "EPC Certificate", "EICR Report"];
  const bad = core.some(n => {
    const v = validity[n];
    return !v || v.status === "expired";
  });
  return bad ? "action-needed" : "all-current";
}

// === Tenant deadlines for "What's coming up" ================================
//
// Pulls from the shared deadline system: pending tenant tasks get anchored
// against the move-in date. Rows ≤ 7 days away get the amber pill.

export interface TenantDeadline {
  id: string;
  group: "This week" | "Around move-in";
  title: string;
  subtitle: string;
  days: number;          // days from today (for sorting / pill threshold)
  displayLabel: string;  // "3 days" or "1 May"
}

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function parseIso(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export function getTenantDeadlines(
  property: Property,
  completed: Record<string, boolean>,
  vaults: Record<string, VaultDoc[]>,
  today: Date = new Date(),
): TenantDeadline[] {
  const vault = vaults[property.id] ?? VAULT_INIT;
  const isDone = isDoneFor(property.id, completed, vault);
  const moveIn = parseIso(property.moveInIso);
  const daysToMoveIn = moveIn ? daysBetween(today, moveIn) : 12;

  // Core pre-move-in deadlines, derived from remaining tenant tasks.
  // Each task-derived deadline has a known offset relative to today (for the
  // demo); in production these would be persisted dates on the task row.
  const candidates: Array<Omit<TenantDeadline, "displayLabel"> & { taskId?: string }> = [
    {
      id: "sign-ast",
      group: "This week",
      title: "Sign tenancy agreement",
      subtitle: "David sent it 2 days ago",
      days: 3,
      taskId: "t1",
    },
    {
      id: "pay-deposit",
      group: "This week",
      title: "Pay security deposit",
      subtitle: `£${property.depositAmount?.toLocaleString() ?? property.rent.toLocaleString()} to ${property.depositScheme ?? "deposit scheme"}`,
      days: 5,
      taskId: "t3",
    },
    {
      id: "move-in-photos",
      group: "Around move-in",
      title: "Take move-in photos",
      subtitle: "Protects your deposit",
      days: Math.max(daysToMoveIn - 2, 7),
      taskId: "t8",
    },
    {
      id: "first-rent",
      group: "Around move-in",
      title: "First rent due",
      subtitle: `£${property.rent.toLocaleString()} · standing order recommended`,
      days: daysToMoveIn,
    },
  ];

  // Filter out anything the tenant has already ticked.
  const openTaskIds = new Set(
    PRE_MOVEIN_PHASES.flatMap(ph => TASK_DATA.tenant[ph] ?? [])
      .filter(t => !isDone(t))
      .map(t => t.id),
  );

  return candidates
    .filter(c => !c.taskId || openTaskIds.has(c.taskId))
    .map(c => {
      const displayLabel =
        c.group === "Around move-in" && c.id === "first-rent" && moveIn
          ? moveIn.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
          : `${c.days} day${c.days === 1 ? "" : "s"}`;
      return {
        id: c.id,
        group: c.group,
        title: c.title,
        subtitle: c.subtitle,
        days: c.days,
        displayLabel,
      };
    })
    .sort((a, b) => a.days - b.days);
}

// === Per-task day offsets ===================================================
//
// Single source of truth for how many days the tenant has until a given
// task's soft deadline. Anchored against the agreed move-in date where
// relevant; demo-fixed for tasks without a natural anchor (e.g. "sign
// tenancy agreement in 3 days"). Returns null for tasks with no deadline
// (e.g. confirm receipt of the How-to-Rent guide).

export function getTenantTaskDays(
  taskId: string,
  property: Property,
  today: Date = new Date(),
): number | null {
  const moveIn = parseIso(property.moveInIso);
  const daysToMoveIn = moveIn ? daysBetween(today, moveIn) : 12;
  switch (taskId) {
    case "t1": return 3;                      // sign tenancy agreement
    case "t2": return 2;                      // pay holding deposit
    case "t3": return 5;                      // pay security deposit
    case "t8": return Math.max(daysToMoveIn - 2, 1);  // move-in photos
    case "t11": return daysToMoveIn;          // smoke/CO alarm confirm
    case "t12": return daysToMoveIn;          // first rent
    case "t_g1": return daysToMoveIn + 14;    // council tax registration
    default: return null;
  }
}

// === Closing strap-line =====================================================

export function getTenantClosingNote(progress: MoveInProgress): string {
  const { done, total } = progress;
  const ratio = total > 0 ? done / total : 0;
  if (ratio === 0) return `Getting set up ${"\u2726"}`;
  if (ratio < 0.6) return `Setting up your tenancy ${"\u2726"}`;
  if (ratio < 1) return `Nearly ready for move-in ${"\u2726"}`;
  return `Welcome to your new home ${"\u2726"}`;
}
