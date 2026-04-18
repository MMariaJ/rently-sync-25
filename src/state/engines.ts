// Functional engines that turn raw state into derived views.
//
//  - rankVaultDocs: attention ordering (expired → expiring → missing → filed)
//  - getLifecyclePhase: auto-detect phase from completion + dates
//  - extractFactsFor: mock AI extraction (deterministic, per the brief)

import {
  DOC_VALIDITY_BY_PROP, VAULT_INIT, PROP_CONTRACT, TASK_DATA,
  type VaultDoc, type DocValidity, type Property, type TaskItem,
} from "@/data/constants";

// === Mock AI extraction =====================================================

export interface ExtractedFacts {
  // The summary line shown next to the ✦ (one-liner)
  summary: string;
  // Optional structured fields
  fields?: Record<string, string>;
}

// Hardcoded but property-aware extractions. Real call would be Lovable AI;
// we mirror the shape so swapping later is mechanical.
export function extractFactsFor(propId: string, docName: string): ExtractedFacts | null {
  const validity = DOC_VALIDITY_BY_PROP[propId]?.[docName];
  const contract = PROP_CONTRACT[propId];

  switch (docName) {
    case "EPC Certificate": {
      const rating = propId === "p1" ? "C (76)"
        : propId === "p2" ? "D (62)"
        : "B (84)";
      const issued = propId === "p1" ? "12 Mar 2024"
        : propId === "p2" ? "14 Apr 2016"
        : "20 Nov 2023";
      return {
        summary: `Rating ${rating} · issued ${issued} · valid 10 years`,
        fields: { rating, issued, validFor: "10 years" },
      };
    }
    case "Gas Safety Certificate":
      return {
        summary: validity ? `Expires ${validity.expiry} · Gas Safe engineer` : "Annual landlord gas safety record",
        fields: { expiry: validity?.expiry ?? "—", checkedBy: "Gas Safe registered" },
      };
    case "EICR Report":
      return {
        summary: validity ? `Valid until ${validity.expiry} · all circuits passed` : "5-yearly electrical installation report",
        fields: { expiry: validity?.expiry ?? "—", outcome: "Satisfactory" },
      };
    case "Tenancy Agreement (AST)":
      return {
        summary: contract ? `${contract.type} · ${contract.start} → ${contract.end}` : "Assured shorthold tenancy",
        fields: contract ? { start: contract.start, end: contract.end, notice: contract.notice } : {},
      };
    case "Deposit Protection Certificate":
      return {
        summary: "Protected · prescribed information served",
        fields: { scheme: propId === "p1" ? "MyDeposits" : "DPS" },
      };
    case "Move-In Inventory":
      return {
        summary: "28 photos · 14 rooms · signed by both parties",
        fields: { photos: "28", rooms: "14" },
      };
    case "HMO Licence":
      return {
        summary: "Licensed · 5-year mandatory licence",
        fields: { type: "Mandatory", validFor: "5 years" },
      };
    default:
      return null;
  }
}

// === Vault attention ranking ================================================

export type DocBucket = "needs-attention" | "still-to-collect" | "filed-current";

export interface RankedDoc {
  doc: VaultDoc;
  bucket: DocBucket;
  validity?: DocValidity;
  daysOverdue?: number;
  daysToExpiry?: number;
}

export const EXPIRING_THRESHOLD_DAYS = 60;

export function rankVaultDocs(propId: string, vault: VaultDoc[], isHmo: boolean): RankedDoc[] {
  const validity = DOC_VALIDITY_BY_PROP[propId] ?? {};
  const visible = vault.filter(d => isHmo || d.name !== "HMO Licence");

  return visible.map(doc => {
    const v = validity[doc.name];
    if (doc.status === "uploaded") {
      if (v?.status === "expired") {
        return { doc, bucket: "needs-attention" as const, validity: v, daysOverdue: Math.abs(v.days) };
      }
      return { doc, bucket: "filed-current" as const, validity: v, daysToExpiry: v?.days };
    }
    // Pending — still to collect (only landlord/both ownership shows in vault collect list)
    return { doc, bucket: "still-to-collect" as const, validity: v };
  }).sort((a, b) => {
    // needs-attention first (most overdue first), then still-to-collect, then filed.
    const order = { "needs-attention": 0, "still-to-collect": 1, "filed-current": 2 };
    if (order[a.bucket] !== order[b.bucket]) return order[a.bucket] - order[b.bucket];
    if (a.bucket === "needs-attention") return (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0);
    if (a.bucket === "filed-current") {
      // Expiring soonest first within filed
      const ad = a.daysToExpiry ?? Infinity;
      const bd = b.daysToExpiry ?? Infinity;
      return ad - bd;
    }
    return 0;
  });
}

// === Lifecycle phase detection ==============================================

export type LifecyclePhase = "Pre-Move-In" | "Move-In" | "During Tenancy" | "Move-Out";

const ACTIVE_PHASES: LifecyclePhase[] = ["Pre-Move-In", "Move-In", "During Tenancy", "Move-Out"];

export function getLifecyclePhase(
  property: Property,
  completed: Record<string, boolean>,
  vaults: Record<string, VaultDoc[]>,
): LifecyclePhase {
  const vault = vaults[property.id] ?? VAULT_INIT;
  const isDocUp = (n: string) => vault.some(d => d.name === n && d.status === "uploaded");
  const isDone = (t: TaskItem) =>
    !!completed[`${property.id}_${t.id}`] || (!!t.vaultDoc && isDocUp(t.vaultDoc));

  for (const ph of ACTIVE_PHASES) {
    const tasks = (TASK_DATA["landlord"][ph] ?? []).filter(
      t => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || property.isHmo)
    );
    if (tasks.some(t => !isDone(t))) return ph;
  }
  return "During Tenancy";
}

// Counts of open vs done tasks per phase, used for the lifecycle tracker
export function getPhaseProgress(
  property: Property,
  completed: Record<string, boolean>,
  vaults: Record<string, VaultDoc[]>,
): Record<LifecyclePhase, { open: number; done: number }> {
  const vault = vaults[property.id] ?? VAULT_INIT;
  const isDocUp = (n: string) => vault.some(d => d.name === n && d.status === "uploaded");
  const isDone = (t: TaskItem) =>
    !!completed[`${property.id}_${t.id}`] || (!!t.vaultDoc && isDocUp(t.vaultDoc));

  const out = {} as Record<LifecyclePhase, { open: number; done: number }>;
  for (const ph of ACTIVE_PHASES) {
    const tasks = (TASK_DATA["landlord"][ph] ?? []).filter(
      t => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || property.isHmo)
    );
    const done = tasks.filter(isDone).length;
    out[ph] = { open: tasks.length - done, done };
  }
  return out;
}
