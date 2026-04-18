import { useState } from "react";
import { HeroHealthyCard, type HeroState } from "./HeroHealthyCard";
import { HealthRow } from "./HealthRow";
import { YourPropertiesSection, type PropertyRow } from "./YourPropertiesSection";
import { WhatsComingUpSection, type UpcomingGroup } from "./WhatsComingUpSection";
import {
  VAULT_INIT,
  type Property, type VaultDoc,
} from "@/data/constants";

interface DashboardProps {
  portfolio: Property[];
  completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>;
  onSelectProperty: (id: string) => void;
  onNavigateToProperties: () => void;
}

const DEFAULT_PROPERTIES: PropertyRow[] = [
  { name: "7 Crane Wharf",   rent: 1850, rating: 4.7, compliance: "All compliant · EICR due in 110 days",      payment: "Paid 3 Apr" },
  { name: "14 Elmwood Road", rent: 1650, rating: 4.9, compliance: "All compliant · Gas safety due in 81 days", payment: "Paid 1 Apr" },
  { name: "3 Saffron Court", rent: 1620, rating: 4.6, compliance: "All compliant · AST renews in 95 days",     payment: "Paid 1 Apr" },
];

const DEFAULT_GROUPS: UpcomingGroup[] = [
  {
    label: "This month",
    amberPill: true,
    items: [{ title: "Gas Safety Certificate", property: "14 Elmwood Road", days: 81 }],
  },
  {
    label: "Later this year",
    items: [
      { title: "Tenancy Agreement", property: "3 Saffron Court", days: 95 },
      { title: "EICR Report", property: "7 Crane Wharf", days: 110 },
      { title: "Deposit Protection", property: "3 Saffron Court", days: 130 },
    ],
  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Dashboard(_props: DashboardProps) {
  const [state, setState] = useState<HeroState>("healthy");

  // Compliance counts
  const counts =
    state === "compliance"
      ? { compliant: 7, dueSoon: 1, overdue: 1 }
      : { compliant: 9, dueSoon: 0, overdue: 0 };

  // Income figures
  const expected = 5120;
  const collected = state === "late" ? 3270 : 5120;

  // Hero per state
  const hero =
    state === "healthy" ? (
      <HeroHealthyCard
        state="healthy"
        itemsOnTrack={9}
        nextDeadlineDays={81}
        rating={4.7}
        reviewCount={14}
      />
    ) : state === "compliance" ? (
      <HeroHealthyCard
        state="compliance"
        headline="David, your EPC at 7 Crane Wharf expired 3 days ago"
        secondary="Fines start at £5,000. This takes about 10 minutes to fix."
        ctaLabel="Renew now"
      />
    ) : (
      <HeroHealthyCard
        state="late"
        headline="David, rent at 7 Crane Wharf is 5 days late"
        secondary="Sarah Chen · £1,850 · send a reminder or start the formal process."
        ctaLabel="Send reminder"
      />
    );

  // Properties per state
  const properties: PropertyRow[] =
    state === "compliance"
      ? DEFAULT_PROPERTIES.map((p) =>
          p.name === "7 Crane Wharf"
            ? { ...p, accent: "danger", compliance: "EPC expired 3 days ago · EICR due in 110 days" }
            : p
        )
      : state === "late"
      ? DEFAULT_PROPERTIES.map((p) =>
          p.name === "7 Crane Wharf" ? { ...p, accent: "danger", paymentDanger: "5 days late" } : p
        )
      : DEFAULT_PROPERTIES;

  const closingNote =
    state === "compliance"
      ? `One thing to handle today ${"\u2726"}`
      : state === "late"
      ? `One thing to handle today ${"\u2726"}`
      : `Nice work — you're on top of things ${"\u2726"}`;

  return (
    <div className="space-y-4 pb-12">
      {/* State toggle — preview only */}
      <div className="flex items-center gap-1 text-[12px]">
        <span className="text-muted-foreground mr-2">Preview state:</span>
        {(["healthy", "compliance", "late"] as HeroState[]).map((s) => (
          <button
            key={s}
            onClick={() => setState(s)}
            className={`rounded-lg px-2.5 py-1 transition-colors ${
              state === s
                ? "bg-foreground text-background"
                : "bg-secondary text-foreground hover:bg-secondary/70"
            }`}
          >
            {s === "healthy" ? "All healthy" : s === "compliance" ? "Compliance issue" : "Late payment"}
          </button>
        ))}
      </div>

      {hero}

      <HealthRow
        compliant={counts.compliant}
        dueSoon={counts.dueSoon}
        overdue={counts.overdue}
        rentCollected={collected}
        rentExpected={expected}
        month="April"
        incomeState={state === "late" ? "late" : "healthy"}
        lateCount={state === "late" ? 1 : 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 pt-2">
        <YourPropertiesSection properties={properties} />
        <WhatsComingUpSection groups={DEFAULT_GROUPS} closingNote={closingNote} />
      </div>
    </div>
  );
}
