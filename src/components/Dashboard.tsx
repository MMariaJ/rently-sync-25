import { HeroHealthyCard } from "./HeroHealthyCard";
import { HealthRow } from "./HealthRow";
import { YourPropertiesSection, type PropertyRow } from "./YourPropertiesSection";
import { WhatsComingUpSection, type UpcomingGroup } from "./WhatsComingUpSection";
import {
  VAULT_INIT, DOC_VALIDITY_BY_PROP, PROP_RATINGS,
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

// Derive a compact "all compliant · next thing in N days" or
// "X expired/overdue · next thing in N days" string per property.
function complianceLineFor(p: Property, vault: VaultDoc[]): { text: string; danger: boolean } {
  const alerts = getPropertyAlerts(p.id, vault);
  const high = alerts.find(a => a.severity === "high");
  const validity = DOC_VALIDITY_BY_PROP[p.id] || {};
  const upcoming = Object.entries(validity)
    .filter(([, v]) => v.status !== "expired" && typeof v.days === "number" && v.days > 0)
    .sort((a, b) => (a[1].days ?? 0) - (b[1].days ?? 0))[0];

  if (high) {
    return { text: `${high.text}`, danger: true };
  }
  if (upcoming) {
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
  const upcomingItems: { title: string; property: string; days: number; severity: "high" | "medium" }[] = [];

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
    const validity = DOC_VALIDITY_BY_PROP[p.id] || {};
    for (const [name, v] of Object.entries(validity)) {
      if (v.status === "valid" && (v.days ?? 0) > 365) continue;
      const sev: "high" | "medium" = v.status === "expired" ? "high" : "medium";
      upcomingItems.push({
        title: name,
        property: p.address.split(",")[0],
        days: v.days ?? 0,
        severity: sev,
      });
    }
  }

  upcomingItems.sort((a, b) => a.days - b.days);

  // ----- Income aggregation -----
  const expected = portfolio.reduce((s, p) => s + p.rent, 0);
  const collected = portfolio.reduce(
    (s, p) => s + (p.paymentStatus === "paid" ? p.rent : 0),
    0,
  );
  const lateCount = portfolio.filter(p => p.paymentStatus === "late").length;
  const incomeState: "healthy" | "late" = lateCount > 0 ? "late" : "healthy";

  // ----- Hero state -----
  const heroState: "healthy" | "compliance" | "late" =
    overdue > 0 ? "compliance" : lateCount > 0 ? "late" : "healthy";

  // Build hero
  let hero;
  if (heroState === "healthy") {
    const nextDays = upcomingItems[0]?.days ?? 0;
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
        secondary="Fines start at £5,000. This takes about 10 minutes to fix."
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

  // ----- Upcoming groups -----
  const thisMonth = upcomingItems.filter(i => i.days <= 31);
  const later = upcomingItems.filter(i => i.days > 31).slice(0, 4);
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
      ? `Nice work — you're on top of things ${"\u2726"}`
      : `One thing to handle today ${"\u2726"}`;

  return (
    <div className="space-y-4 pb-12">
      {hero}

      <HealthRow
        compliant={compliant}
        dueSoon={dueSoon}
        overdue={overdue}
        rentCollected={collected}
        rentExpected={expected}
        month="April"
        incomeState={incomeState}
        lateCount={lateCount}
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
