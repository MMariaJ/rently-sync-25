import { HeroHealthyCard } from "./HeroHealthyCard";
import { HealthRow } from "./HealthRow";
import { YourPropertiesSection, type PropertyRow } from "./YourPropertiesSection";
import { WhatsComingUpSection, type UpcomingGroup } from "./WhatsComingUpSection";
import {
  VAULT_INIT, DOC_VALIDITY_BY_PROP, PROP_RATINGS, PROP_ALERTS,
  LANDLORD_PROFILE,
  type Property, type VaultDoc,
} from "@/data/constants";
import { getPropertyAlerts } from "@/data/helpers";

interface DashboardProps {
  portfolio: Property[];
  completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>;
  onSelectProperty: (id: string) => void;
  onNavigateToProperties: () => void;
}

// Near-horizon window for the property-row suffix. Anything further out is
// noise on the portfolio page, so we just say "All compliant".
const NEAR_DEADLINE_DAYS = 30;

// Derive a compact "all compliant · next thing in N days" or
// "X expired/overdue · next thing in N days" string per property.
function complianceLineFor(p: Property, vault: VaultDoc[]): { text: string; danger: boolean } {
  // AST gate: surfaced as a row-level action (not a PROP_ALERT) so it
  // shows up inline on the property list without hijacking the Dashboard
  // compliance hero. Clicking the row routes the landlord to the property
  // page where the in-property banner closes the loop.
  const contractFiled =
    p.contractUploaded ||
    vault.some(d => d.name === "Tenancy Agreement (AST)" && d.status === "uploaded");
  if (!contractFiled) {
    return { text: "Tenancy agreement not uploaded · Upload to start move-in", danger: true };
  }

  const alerts = getPropertyAlerts(p.id, vault);
  const high = alerts.find(a => a.severity === "high");
  const validity = DOC_VALIDITY_BY_PROP[p.id] || {};
  const upcoming = Object.entries(validity)
    .filter(([, v]) => v.status !== "expired" && typeof v.days === "number" && v.days > 0)
    .sort((a, b) => (a[1].days ?? 0) - (b[1].days ?? 0))[0];

  if (high) {
    return { text: `${high.text}`, danger: true };
  }
  if (upcoming && (upcoming[1].days ?? 0) <= NEAR_DEADLINE_DAYS) {
    const [name, v] = upcoming;
    const short = name.replace(" Certificate", "").replace(" Report", "").replace(" (AST)", "");
    return { text: `All compliant · ${short} due in ${v.days} days`, danger: false };
  }
  return { text: "All compliant", danger: false };
}

export function Dashboard({
  portfolio, completed, allVaults, onSelectProperty,
}: DashboardProps) {
  // ----- Aggregate compliance counts across the portfolio -----
  let compliant = 0, dueSoon = 0, overdue = 0;
  const propertyRows: PropertyRow[] = [];
  const upcomingItems: {
    title: string;
    property: string;
    days: number;
    severity: "high" | "medium";
    label?: string;
    sub?: string;
  }[] = [];

  for (const p of portfolio) {
    const vault = allVaults[p.id] || VAULT_INIT;
    const alerts = getPropertyAlerts(p.id, vault);
    const hasHigh = alerts.some(a => a.severity === "high");
    const hasMed = alerts.some(a => a.severity === "medium");
    if (hasHigh) overdue++;
    else if (hasMed) dueSoon++;
    else compliant++;

    const line = complianceLineFor(p, vault);
    const pr = PROP_RATINGS[p.id] || { rating: 0, count: 0 };
    const isLate = p.paymentStatus === "late";
    propertyRows.push({
      name: p.address.split(",")[0],
      rent: p.rent,
      rating: pr.rating,
      compliance: line.text,
      payment: p.paidDate ? `Paid ${p.paidDate}` : p.dueDate ? `Due ${p.dueDate}` : "—",
      accent: (line.danger || isLate) ? "danger" : "default",
      paymentDanger: isLate && p.daysLate ? `${p.daysLate} days late` : undefined,
    });

    // Collect items for "What's coming up"
    const propName = p.address.split(",")[0];
    const validity = DOC_VALIDITY_BY_PROP[p.id] || {};
    for (const [name, v] of Object.entries(validity)) {
      if (v.status === "valid" && (v.days ?? 0) > 365) continue;
      // Skip docs the landlord has just re-uploaded (renewal): the static
      // validity record still says "expired" but the vault timestamp shows
      // it's been refreshed.
      const vaultEntry = vault.find(d => d.name === name);
      const freshlyUploaded =
        vaultEntry?.status === "uploaded" && vaultEntry?.timestamp === "Just now";
      if (freshlyUploaded && v.status === "expired") continue;
      const sev: "high" | "medium" = v.status === "expired" ? "high" : "medium";
      const isExpired = v.status === "expired";
      // Near-deadline docs (≤31 days or already expired) reword as
      // "needs a renewal" so the task card reads as action-oriented.
      const needsRenewal =
        isExpired || (v.status === "expiring" && (v.days ?? 999) <= 31);
      const shortName = name
        .replace(" Certificate", "")
        .replace(" Report", "")
        .replace(" (AST)", "");
      upcomingItems.push({
        title: needsRenewal ? `${shortName} certificate needs a renewal` : name,
        property: propName,
        days: v.days ?? 0,
        severity: sev,
        label: isExpired ? "Renew" : undefined,
      });
    }

    // Surface non-doc alerts (e.g. Renters' Rights contract review, Smoke &
    // CO alarm evidence) so they appear in "What's coming up" alongside
    // expiring docs. Vault-linked alerts are skipped since DOC_VALIDITY
    // already covers them.
    for (const a of PROP_ALERTS[p.id] || []) {
      if (a.linkedTab === "vault") continue;
      // Pin high items above any positive-day item; medium items sit inside
      // "this month" via a small positive offset.
      const days = a.severity === "high" ? -0.5 : 20;
      upcomingItems.push({
        title: a.text,
        property: propName,
        days,
        severity: a.severity,
        label: a.action || "Review",
      });
    }
  }

  upcomingItems.sort((a, b) => a.days - b.days);

  // ----- Income aggregation -----
  // Expected reflects the full portfolio rent roll so the banner reads against
  // a true total. Collected excludes p1 (Sarah) — she doesn't move in until
  // 1 May so her April rent hasn't landed yet — and anyone flagged late.
  const expected = portfolio.reduce((s, p) => s + p.rent, 0);
  const collected = portfolio.reduce(
    (s, p) =>
      s + (p.id === "p1" || p.paymentStatus === "late" ? 0 : p.rent),
    0,
  );
  const lateCount = portfolio.filter(p => p.paymentStatus === "late").length;
  const incomeState: "healthy" | "late" = lateCount > 0 ? "late" : "healthy";

  // Historical missed payment surfaced on the income card.
  const missedPayment = {
    address: "7 Crane Wharf",
    month: "Feb 2026",
  };

  // ----- Hero state -----
  const heroState: "healthy" | "compliance" | "late" =
    overdue > 0 ? "compliance" : lateCount > 0 ? "late" : "healthy";

  // Build hero
  let hero;
  if (heroState === "healthy") {
    // "Next deadline" uses the real doc-validity horizon (not the fabricated
    // days we attach to non-doc alerts for sort purposes), so it lines up
    // with the "X due in N days" shown on each property row.
    let earliest = Number.POSITIVE_INFINITY;
    for (const p of portfolio) {
      const validity = DOC_VALIDITY_BY_PROP[p.id] || {};
      for (const v of Object.values(validity)) {
        if (v.status === "expired") continue;
        if (typeof v.days !== "number" || v.days <= 0) continue;
        if (v.days < earliest) earliest = v.days;
      }
    }
    const nextDays = earliest === Number.POSITIVE_INFINITY ? 0 : earliest;
    const totalItems = compliant + dueSoon + overdue;
    hero = (
      <HeroHealthyCard
        state="healthy"
        itemsOnTrack={totalItems}
        nextDeadlineDays={nextDays}
        rating={LANDLORD_PROFILE.rating}
        reviewCount={LANDLORD_PROFILE.reviewCount}
      />
    );
  } else if (heroState === "compliance") {
    // Pick the worst property
    const worst = portfolio.find(p => {
      const a = getPropertyAlerts(p.id, allVaults[p.id] || VAULT_INIT);
      return a.some(x => x.severity === "high");
    });
    const worstName = worst ? worst.address.split(",")[0] : "your property";
    const issue = worst ? getPropertyAlerts(worst.id, allVaults[worst.id] || VAULT_INIT).find(a => a.severity === "high") : undefined;
    hero = (
      <HeroHealthyCard
        state="compliance"
        headline={`David, ${issue?.text ?? "a compliance item needs your attention"} at ${worstName}`}
        secondary="Fines start at £5,000. This takes about 5 minutes to fix."
        ctaLabel={issue?.action ?? "Resolve now"}
        onCtaClick={worst ? () => onSelectProperty(worst.id) : undefined}
      />
    );
  } else {
    const lateProp = portfolio.find(p => p.paymentStatus === "late");
    const name = lateProp ? lateProp.address.split(",")[0] : "your property";
    hero = (
      <HeroHealthyCard
        state="late"
        headline={`David, rent at ${name} is ${lateProp?.daysLate ?? ""} days late`}
        secondary={`${lateProp?.tenant ?? ""} · £${lateProp?.rent.toLocaleString() ?? ""} · send a reminder or start the formal process.`}
        ctaLabel="Send reminder"
        onCtaClick={lateProp ? () => onSelectProperty(lateProp.id) : undefined}
      />
    );
  }

  // ----- Compliance Health (task-level view) -----
  // The property-level counts (compliant/dueSoon/overdue) drive the hero and
  // the "worst property" pick above. For the Compliance Health bar we show a
  // richer, per-task breakdown across the portfolio (total 9 tasks) so the
  // landlord sees a mix of green/amber/red. The overdue count is reactive —
  // once the outstanding high-severity alert is resolved (doc renewed), the
  // red segment flips into the compliant bucket.
  const portfolioHasHigh = overdue > 0;
  const healthOverdue = portfolioHasHigh ? 1 : 0;
  const healthDueSoon = 3;
  const healthCompliant = 9 - healthOverdue - healthDueSoon;

  // ----- Upcoming groups -----
  // "This month" is ≤31 days; "Later this year" caps at 60 days so the
  // landlord only sees items actually due soon (two-month horizon). Further
  // out is noise — we drop it until it comes closer.
  const thisMonth = upcomingItems.filter(i => i.days <= 31);
  const later = upcomingItems
    .filter(i => i.days > 31 && i.days <= 60)
    .slice(0, 4);
  const groups: UpcomingGroup[] = [];
  if (thisMonth.length > 0) {
    groups.push({ label: "This month", amberPill: true, items: thisMonth });
  }
  if (later.length > 0) {
    groups.push({ label: "Later this year", items: later });
  }
  if (groups.length === 0) {
    groups.push({ label: "Upcoming", items: [] });
  }

  const closingNote =
    heroState === "healthy"
      ? `All things done today, nice job ${"\u2726"}`
      : `One thing to handle today ${"\u2726"}`;

  return (
    <div className="space-y-4 pb-12">
      {hero}

      <HealthRow
        compliant={healthCompliant}
        dueSoon={healthDueSoon}
        overdue={healthOverdue}
        rentCollected={collected}
        rentExpected={expected}
        month="April"
        incomeState={incomeState}
        lateCount={lateCount}
        missedPayment={missedPayment}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 pt-2">
        <YourPropertiesSection
          properties={propertyRows}
          onSelect={(name) => {
            const p = portfolio.find(p => p.address.split(",")[0] === name);
            if (p) onSelectProperty(p.id);
          }}
        />
        <WhatsComingUpSection groups={groups} closingNote={closingNote} />
      </div>
    </div>
  );
}
