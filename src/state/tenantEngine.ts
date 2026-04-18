// Tenant-side derived state.
//
// Mirrors engines.ts but reads TASK_DATA["tenant"] instead of landlord.
// Also exposes a tenant-flavoured hero builder so the Overview matches the
// landlord page in shape (headline / subline / cta / tone) but speaks to the
// things a tenant actually cares about: rent, deposit, repairs, move-in tasks.

import {
  TASK_DATA, VAULT_INIT,
  type Property, type VaultDoc, type TaskItem,
} from "@/data/constants";
import type { LifecyclePhase } from "./engines";

const ACTIVE_PHASES: LifecyclePhase[] = ["Pre-Move-In", "Move-In", "During Tenancy", "Move-Out"];

function isDoneFor(propId: string, completed: Record<string, boolean>, vault: VaultDoc[]) {
  const isDocUp = (n: string) => vault.some(d => d.name === n && d.status === "uploaded");
  return (t: TaskItem) =>
    !!completed[`${propId}_${t.id}`] || (!!t.vaultDoc && isDocUp(t.vaultDoc));
}

export function getTenantPhase(
  property: Property,
  completed: Record<string, boolean>,
  vaults: Record<string, VaultDoc[]>,
): LifecyclePhase {
  const vault = vaults[property.id] ?? VAULT_INIT;
  const isDone = isDoneFor(property.id, completed, vault);
  for (const ph of ACTIVE_PHASES) {
    const tasks = (TASK_DATA.tenant[ph] ?? []).filter(t => !t.isContractSign);
    if (tasks.some(t => !isDone(t))) return ph;
  }
  return "During Tenancy";
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
    const tasks = (TASK_DATA.tenant[ph] ?? []).filter(t => !t.isContractSign);
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
    return {
      headline: "Sign your tenancy agreement to lock in move-in",
      subline: "Once signed, your deposit can be protected and keys arranged.",
      cta: "Review & sign",
    };
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
