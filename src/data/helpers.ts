import {
  PHASES, TASK_DATA, VAULT_INIT, PROP_ALERTS, DOC_VALIDITY_BY_PROP, PORTFOLIO,
  REVIEWS_SEED, PAST_TENANCIES, USERS,
  PROPERTY_UTILITIES, RELIABILITY_TIERS,
  type Property, type TaskItem, type VaultDoc, type Alert, type Review, type UserRole,
  type ReliabilityTier, type BillTenantStatus, type Utility,
} from "./constants";

const ALERT_DOC_NAMES = [
  { name: "Gas Safety Certificate", short: "Gas Safety" },
  { name: "EPC Certificate", short: "EPC" },
  { name: "EICR Report", short: "EICR" },
  { name: "Deposit Protection Certificate", short: "Deposit Cert" },
  { name: "How to Rent Guide", short: "How to Rent" },
];

// Keyword → canonical doc name. Used to match a free-text PROP_ALERT (e.g.
// "Gas Safety Certificate renewal overdue") back to the vault doc that, when
// re-uploaded, should clear the alert.
const ALERT_KEYWORD_TO_DOC: Record<string, string> = {
  "gas safety": "Gas Safety Certificate",
  "epc": "EPC Certificate",
  "eicr": "EICR Report",
  "deposit": "Deposit Protection Certificate",
};

// A vault doc with timestamp "Just now" represents a fresh (renewal) upload —
// i.e. the landlord just re-submitted the certificate. We treat that as
// superseding whatever the static DOC_VALIDITY record says.
export const isFreshlyUploaded = (docs: VaultDoc[], name: string): boolean =>
  docs.some(d => d.name === name && d.status === "uploaded" && d.timestamp === "Just now");

export const getPropertyAlerts = (propId: string, propVault: VaultDoc[]): Alert[] => {
  const propAlerts = PROP_ALERTS[propId] || [];
  const propDocValidity = DOC_VALIDITY_BY_PROP[propId] || {};
  const propAddr = PORTFOLIO.find(p => p.id === propId)?.address || propId;
  const propLabel = propAddr.split(",")[0];

  const docIssues = ALERT_DOC_NAMES.map(({ name, short }) => {
    const vaultEntry = propVault.find(d => d.name === name);
    const uploaded = vaultEntry?.status === "uploaded";
    const freshUpload = uploaded && vaultEntry?.timestamp === "Just now";
    const validity = propDocValidity[name];
    const hasValidRecord = validity && validity.status !== "expired";

    // A fresh re-upload overrides any "expired" validity record — the doc
    // has just been renewed. For stale-uploaded docs we still respect the
    // validity status, so an initially-uploaded-but-expired cert still alerts.
    let status: "valid" | "expiring" | "expired" | "missing";
    if (freshUpload) {
      status = "valid";
    } else if (uploaded) {
      status = validity?.status ?? "valid";
    } else if (hasValidRecord) {
      status = validity!.status;
    } else if (validity?.status === "expired") {
      status = "expired";
    } else {
      status = "missing";
    }

    if (status === "valid") return null;
    return { short, status, severity: (status === "expired" || status === "missing" ? "high" : "medium") as "high" | "medium", docName: name, days: validity?.days };
  }).filter(Boolean) as { short: string; status: string; severity: "high" | "medium"; docName: string; days?: number }[];

  const coveredDocs = new Set(docIssues.filter(d => propAlerts.some(a => a.text.toLowerCase().includes(d.short.toLowerCase()))).map(d => d.docName));

  // Suppress any PROP_ALERT whose linked doc was just re-uploaded.
  const filteredPropAlerts = propAlerts.filter(a => {
    const t = a.text.toLowerCase();
    for (const [kw, docName] of Object.entries(ALERT_KEYWORD_TO_DOC)) {
      if (t.includes(kw) && isFreshlyUploaded(propVault, docName)) return false;
    }
    return true;
  });

  return [
    ...filteredPropAlerts.map(a => ({
      text: a.text,
      severity: a.severity,
      action: a.action || "View",
      type: "alert" as const,
      linkedTab: a.linkedTab,
      linkedPhaseIdx: a.linkedPhaseIdx,
      propId,
      property: propLabel,
    })),
    ...docIssues.filter(d => !coveredDocs.has(d.docName)).map(d => ({
      text: `${d.short} — ${d.status === "missing" ? "missing" : d.status === "expired" ? "expired" : "expiring soon"}`,
      severity: d.severity,
      action: d.status === "missing" ? "Upload" : d.status === "expired" ? "Renew" : "Review",
      type: "doc" as const,
      linkedTab: "vault" as string | undefined,
      linkedPhaseIdx: undefined,
      propId,
      property: propLabel,
    })),
  ].sort((a, b) => a.severity === "high" && b.severity !== "high" ? -1 : a.severity !== "high" && b.severity === "high" ? 1 : 0);
};

export const getLifecycleStage = (p: Property): string => {
  if (p.status === "vacant") return "Vacant";
  return "Active";
};

// Required landlord documents past their statutory deadline.
//
// A document is considered overdue when:
//   - It's uploaded but the validity record reads expired (and it hasn't
//     just been re-uploaded), OR
//   - It's not yet uploaded and we're already past the tenancy start date.
//
// Only docs that carry `statutoryDeadline` + `whyThisMatters` metadata
// participate — this keeps the Waiting zone scoped to the four landlord
// obligations the tenant can reasonably hold the landlord accountable for.
export interface OverdueLandlordDoc {
  docName: string;
  statutoryDeadline: string;
  whyThisMatters: string;
  // Ready-to-render sentence combining the rule and the breach, e.g.
  // "Annual certificate required — this one expired 4 days ago".
  deadlineBreach: string;
  daysOverdue: number;
}

export const getOverdueLandlordDocs = (
  property: Property,
  vault: VaultDoc[],
): OverdueLandlordDoc[] => {
  const validity = DOC_VALIDITY_BY_PROP[property.id] ?? {};
  const moveIn = property.moveInIso ? new Date(property.moveInIso) : null;
  const now = new Date();
  const out: OverdueLandlordDoc[] = [];

  for (const doc of vault) {
    if (doc.owner !== "landlord") continue;
    if (!doc.statutoryDeadline || !doc.whyThisMatters) continue;

    const v = validity[doc.name];
    const freshRenewal = doc.timestamp === "Just now";
    const uploadedAndExpired =
      doc.status === "uploaded" && v?.status === "expired" && !freshRenewal;

    if (uploadedAndExpired) {
      const days = v ? Math.abs(v.days) : 0;
      out.push({
        docName: doc.name,
        statutoryDeadline: doc.statutoryDeadline,
        whyThisMatters: doc.whyThisMatters,
        deadlineBreach: `${doc.statutoryDeadline} — this one expired ${days} ${days === 1 ? "day" : "days"} ago`,
        daysOverdue: days,
      });
      continue;
    }

    if (doc.status !== "uploaded" && moveIn) {
      const diffMs = now.getTime() - moveIn.getTime();
      const daysPastStart = Math.floor(diffMs / 86_400_000);
      if (daysPastStart > 0) {
        out.push({
          docName: doc.name,
          statutoryDeadline: doc.statutoryDeadline,
          whyThisMatters: doc.whyThisMatters,
          deadlineBreach: `${doc.statutoryDeadline} — missed by ${daysPastStart} ${daysPastStart === 1 ? "day" : "days"}`,
          daysOverdue: daysPastStart,
        });
      }
    }
  }

  return out;
};

export const getComplianceForProperty = (
  propId: string,
  role: string,
  completed: Record<string, boolean>,
  vaults: Record<string, VaultDoc[]>,
  isHmo: boolean
): number => {
  const vault = vaults[propId] || VAULT_INIT;
  const isDocUploaded = (name: string) => vault.some(d => d.name === name && d.status === "uploaded");
  const isTaskDone = (task: TaskItem) => {
    if (completed[`${propId}_${task.id}`]) return true;
    if (task.vaultDoc && isDocUploaded(task.vaultDoc)) return true;
    return false;
  };

  const allTasks = PHASES.flatMap(p => (TASK_DATA[role]?.[p] || []).filter(
    (t: TaskItem) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || isHmo)
  ));
  const doneCount = allTasks.filter(isTaskDone).length;
  return allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0;
};

export const getRAGColor = (pct: number): string => {
  if (pct === 0) return "hsl(var(--muted-foreground))";
  if (pct < 50) return "hsl(var(--danger))";
  if (pct < 80) return "hsl(var(--warning))";
  return "hsl(var(--success))";
};

export const getRAGLabel = (pct: number): string => {
  if (pct === 0) return "Not started";
  if (pct < 50) return "Action required";
  if (pct < 80) return "Needs attention";
  return "Compliant";
};

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export type ReviewDirection = "received" | "given";

// Combined list of seed + runtime reviews, newest first. Callers who want
// the merged set should go through this so ordering is consistent.
export const mergeReviews = (runtime: Review[]): Review[] => {
  return [...runtime, ...REVIEWS_SEED].sort((a, b) => b.createdAt - a.createdAt);
};

export const getReviewsFor = (
  allReviews: Review[],
  userId: string,
  direction: ReviewDirection,
): Review[] => {
  if (direction === "received") {
    return allReviews.filter(r => r.subjectId === userId);
  }
  return allReviews.filter(r => r.authorId === userId);
};

// A prompt describing why the user should leave a review *right now*.
// Scoped to the triggers the spec asks for: end-of-tenancy (either side)
// and tenancy renewal (tenant reviewing landlord). Returns null when no
// valid moment exists for this user.
export interface ReviewMoment {
  subjectId: string;
  subjectName: string;
  subjectRole: UserRole;
  propertyId: string;
  tenancyId: string;
  triggerReason: "end-of-tenancy" | "renewal";
  triggerDate: string;
}

export const getReviewMoment = (
  allReviews: Review[],
  userId: string,
  role: UserRole,
): ReviewMoment | null => {
  // Has the user already authored a review of this subject for this tenancy?
  const alreadyReviewed = (subjectId: string, tenancyId: string): boolean =>
    allReviews.some(r =>
      r.authorId === userId && r.subjectId === subjectId && r.tenancyId === tenancyId
    );

  if (role === "landlord") {
    // Landlord moment: a tenant whose tenancy ended and whom the landlord
    // hasn't yet reviewed. Walk PAST_TENANCIES for anything involving this
    // landlord as the counterparty.
    for (const t of PAST_TENANCIES) {
      if (t.landlordId !== userId) continue;
      if (alreadyReviewed(t.tenantId, t.id)) continue;
      const tenantUser = USERS[t.tenantId];
      if (!tenantUser) continue;
      return {
        subjectId: t.tenantId,
        subjectName: tenantUser.name,
        subjectRole: "tenant",
        propertyId: t.propertyId,
        tenancyId: t.id,
        triggerReason: "end-of-tenancy",
        triggerDate: t.endedAt,
      };
    }
    return null;
  }

  // Tenant moment: a landlord from a past tenancy, not yet reviewed.
  for (const t of PAST_TENANCIES) {
    if (t.tenantId !== userId) continue;
    if (alreadyReviewed(t.landlordId, t.id)) continue;
    const llUser = USERS[t.landlordId];
    if (!llUser) continue;
    return {
      subjectId: t.landlordId,
      subjectName: llUser.name,
      subjectRole: "landlord",
      propertyId: t.propertyId,
      tenancyId: t.id,
      triggerReason: "end-of-tenancy",
      triggerDate: t.endedAt,
    };
  }
  return null;
};

// Aggregate per-dimension scores across a set of reviews. Returns null if
// none of the reviews carry dimension data for the requested direction.
export const aggregateTenantDimensions = (reviews: Review[]) => {
  const sums = { responsiveness: 0, maintenance: 0, fairness: 0, communication: 0 };
  let n = 0;
  for (const r of reviews) {
    if (!r.tenantDimensions) continue;
    sums.responsiveness += r.tenantDimensions.responsiveness;
    sums.maintenance += r.tenantDimensions.maintenance;
    sums.fairness += r.tenantDimensions.fairness;
    sums.communication += r.tenantDimensions.communication;
    n++;
  }
  if (n === 0) return null;
  return {
    responsiveness: sums.responsiveness / n,
    maintenance: sums.maintenance / n,
    fairness: sums.fairness / n,
    communication: sums.communication / n,
    count: n,
  };
};

export const aggregateLandlordDimensions = (reviews: Review[]) => {
  const sums = { paysOnTime: 0, communication: 0, careOfProperty: 0 };
  let n = 0;
  for (const r of reviews) {
    if (!r.landlordDimensions) continue;
    sums.paysOnTime += r.landlordDimensions.paysOnTime;
    sums.communication += r.landlordDimensions.communication;
    sums.careOfProperty += r.landlordDimensions.careOfProperty;
    n++;
  }
  if (n === 0) return null;
  return {
    paysOnTime: sums.paysOnTime / n,
    communication: sums.communication / n,
    careOfProperty: sums.careOfProperty / n,
    count: n,
  };
};

// Simple aggregate score — average of the `rating` field.
export const aggregateScore = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
};

// ---------------------------------------------------------------------------
// Utility-bill reliability
// ---------------------------------------------------------------------------
// These helpers centralise the "how reliable is this tenant at paying their
// utility bills" calculation so any surface (PaymentsTab, Reviews, Health)
// can read from the same source. `tenantId` is the HMO tenant id for HMO
// properties, or the synthetic `${propId}-tenant` id for single-let.

// Map a percentage (0-100) to a reliability tier spec. Thresholds live on
// RELIABILITY_TIERS so the whole product speaks the same vocabulary.
export const getReliabilityTier = (percentage: number): ReliabilityTier => {
  if (percentage >= RELIABILITY_TIERS.reliable.minPercentage) return "reliable";
  if (percentage >= RELIABILITY_TIERS["mostly-reliable"].minPercentage) return "mostly-reliable";
  return "inconsistent";
};

export interface ReliabilityScore {
  onTime: number;
  total: number;
  percentage: number; // 0-100, rounded to int
  tier: ReliabilityTier;
}

// Walk a property's utilities and count on-time vs late payments for one
// tenant across the last N months (default 6). Includes the current-month
// bill when a status is already resolved (paid/late). `not-due`/`pending`
// are excluded from the denominator — we only score what's been called.
export const getReliabilityScore = (
  propertyId: string,
  tenantId: string,
  periodMonths = 6,
): ReliabilityScore => {
  const utilities = PROPERTY_UTILITIES[propertyId] ?? [];
  let onTime = 0;
  let total = 0;

  for (const util of utilities) {
    // Most-recent-last ordering; take the tail when periodMonths < history.
    const history = util.paymentHistory.slice(-Math.max(periodMonths - 1, 0));
    for (const rec of history) {
      const entry = rec.perTenant[tenantId];
      if (!entry) continue;
      total += 1;
      if (entry.status === "paid") onTime += 1;
    }
    // Fold the current bill into the denominator only if it's already
    // resolved — otherwise "not yet due" skews the ratio.
    const cur = util.currentBill.perTenant[tenantId];
    if (cur && (cur.status === "paid" || cur.status === "late")) {
      total += 1;
      if (cur.status === "paid") onTime += 1;
    }
  }

  const percentage = total === 0 ? 100 : Math.round((onTime / total) * 100);
  return { onTime, total, percentage, tier: getReliabilityTier(percentage) };
};

// Per-month summary for the reliability strip. Each entry reports how many
// bills were on time vs total in that month so the renderer can draw a
// proportional green/red segment (fully green when total === onTime, partial
// red otherwise). Oldest-first ordering, length === periodMonths.
export interface ReliabilityStripMonth {
  month: string;
  monthIso: string;
  onTime: number;
  total: number;
  inProgress: boolean;
}

export const getMonthlyReliabilityStrip = (
  propertyId: string,
  tenantId: string,
  periodMonths = 6,
): ReliabilityStripMonth[] => {
  const utilities = PROPERTY_UTILITIES[propertyId] ?? [];
  const byMonth = new Map<string, ReliabilityStripMonth>();

  const bump = (key: string, month: string, onTime: boolean, inProgress: boolean) => {
    const existing = byMonth.get(key);
    if (existing) {
      existing.total += 1;
      if (onTime) existing.onTime += 1;
      if (inProgress) existing.inProgress = true;
    } else {
      byMonth.set(key, {
        month,
        monthIso: key,
        onTime: onTime ? 1 : 0,
        total: 1,
        inProgress,
      });
    }
  };

  for (const util of utilities) {
    for (const rec of util.paymentHistory) {
      const entry = rec.perTenant[tenantId];
      if (!entry) continue;
      bump(rec.monthIso, rec.month, entry.status === "paid", false);
    }
    const cur = util.currentBill.perTenant[tenantId];
    if (cur && (cur.status === "paid" || cur.status === "late")) {
      const iso = util.currentBill.dueDateIso.slice(0, 7);
      const monthLabel = new Date(util.currentBill.dueDateIso).toLocaleString("en-GB", { month: "short" });
      bump(iso, monthLabel, cur.status === "paid", true);
    }
  }

  return Array.from(byMonth.values())
    .sort((a, b) => a.monthIso.localeCompare(b.monthIso))
    .slice(-periodMonths);
};

// Resolve a single tenant's status on the current bill of a specific utility.
// Returns the raw BillTenantStatus or "not-due" when the tenant has no entry.
export const getCurrentBillStatusForTenant = (
  propertyId: string,
  utilityId: string,
  tenantId: string,
): BillTenantStatus => {
  const utilities = PROPERTY_UTILITIES[propertyId] ?? [];
  const util = utilities.find(u => u.id === utilityId);
  if (!util) return "not-due";
  return util.currentBill.perTenant[tenantId]?.status ?? "not-due";
};

// Convenience: pull all utilities for a property.
export const getUtilitiesForProperty = (propertyId: string): Utility[] =>
  PROPERTY_UTILITIES[propertyId] ?? [];

// Tenant-side: synthesise empty placeholder Utility rows for the tenant
// setup tasks they've ticked off (t_u1 / t_u2 / t_u3 / t_g1). A placeholder
// means "I linked the account, no bills yet" — the row carries no amount,
// no history, and opts out of reliability rendering. Any placeholder whose
// utility type already exists on the property as real data is suppressed.
const TENANT_UTILITY_TASKS: Array<{
  taskId: string;
  type: Utility["type"];
  typeLabel: string;
  idSuffix: string;
}> = [
  { taskId: "t_u1", type: "electricity",  typeLabel: "Energy",      idSuffix: "energy" },
  { taskId: "t_u2", type: "water",        typeLabel: "Water",       idSuffix: "water" },
  { taskId: "t_u3", type: "broadband",    typeLabel: "Broadband",   idSuffix: "broadband" },
  { taskId: "t_g1", type: "council-tax",  typeLabel: "Council Tax", idSuffix: "council" },
];

export const getTenantUtilityPlaceholders = (
  propertyId: string,
  completed: Record<string, boolean>,
): Utility[] => {
  const existing = new Set(
    (PROPERTY_UTILITIES[propertyId] ?? []).map(u => u.type),
  );
  const out: Utility[] = [];
  for (const cfg of TENANT_UTILITY_TASKS) {
    if (!completed[`${propertyId}_${cfg.taskId}`]) continue;
    if (existing.has(cfg.type)) continue;
    out.push({
      id: `${propertyId}-placeholder-${cfg.idSuffix}`,
      type: cfg.type,
      typeLabel: cfg.typeLabel,
      provider: "Not yet set up",
      currentBill: {
        amount: 0,
        billDate: "—",
        dueDate: "—",
        dueDateIso: "",
        perTenant: {},
      },
      paymentHistory: [],
      placeholder: true,
    });
  }
  return out;
};
