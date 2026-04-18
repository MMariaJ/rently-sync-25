import { ChevronRight } from "lucide-react";
import { ComplianceDonut } from "./ComplianceDonut";
import { DeadlineCalendar, type DeadlineDate } from "./DeadlineCalendar";
import { HeroHealthyCard } from "./HeroHealthyCard";
import { HealthRow } from "./HealthRow";
import { YourPropertiesSection } from "./YourPropertiesSection";
import {
  TENANT_INFO, HMO_TENANTS, VAULT_INIT,
  LANDLORD_PROFILE, DOC_VALIDITY_BY_PROP,
  type Property, type VaultDoc,
} from "@/data/constants";
import { getPropertyAlerts, getComplianceForProperty } from "@/data/helpers";

const isCritical = (a: { text: string; severity: "high" | "medium" }) => {
  if (a.severity !== "high") return false;
  const t = a.text.toLowerCase();
  return t.includes("overdue") || t.includes("expired") || t.includes("missing") || t.includes("required");
};

interface DashboardProps {
  portfolio: Property[];
  completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>;
  onSelectProperty: (id: string) => void;
  onNavigateToProperties: () => void;
}

export function Dashboard({ portfolio, completed, allVaults, onSelectProperty, onNavigateToProperties }: DashboardProps) {
  const monthlyIncome = portfolio.reduce((s, p) => s + p.rent, 0);
  const avgCompliance = Math.round(
    portfolio.reduce((s, p) => s + getComplianceForProperty(p.id, "landlord", completed, allVaults, !!p.isHmo), 0) / Math.max(portfolio.length, 1)
  );
  const allAlerts = portfolio.flatMap(p => getPropertyAlerts(p.id, allVaults[p.id] || VAULT_INIT));
  const criticalAlerts = allAlerts.filter(isCritical);
  const totalTenants = portfolio.reduce((s, p) => {
    if (p.isHmo && HMO_TENANTS[p.id]) return s + HMO_TENANTS[p.id].length;
    if (TENANT_INFO[p.id]) return s + 1;
    return s;
  }, 0);

  const allDeadlines: DeadlineDate[] = portfolio.flatMap((p) => {
    const validity = DOC_VALIDITY_BY_PROP[p.id] || {};
    const shortAddr = p.address.split(",")[0];
    return Object.entries(validity)
      .filter(([, v]) => v.status === "expired" || (v.days > 0 && v.days <= 365))
      .map(([name, v]) => {
        const dt = new Date(v.expiry);
        if (isNaN(dt.getTime())) return null;
        return { date: dt, label: name, status: v.status, days: v.days, property: shortAddr };
      })
      .filter(Boolean) as DeadlineDate[];
  }).sort((a, b) => a.days - b.days);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const isHealthy = criticalAlerts.length === 0;
  const allValidity = portfolio.flatMap((p) => Object.values(DOC_VALIDITY_BY_PROP[p.id] || {}));
  const overdue = allValidity.filter((v) => v.status === "expired").length;
  const dueSoon = allValidity.filter((v) => v.status !== "expired" && v.days > 0 && v.days <= 60).length;
  const compliant = allValidity.length - overdue - dueSoon;
  const itemsOnTrack = compliant + dueSoon;
  const nextDeadlineDays = allDeadlines[0]?.days ?? 0;
  const monthName = new Date().toLocaleString("en-GB", { month: "long" });

  return (
    <div className="space-y-6 pb-12">
      <HeroHealthyCard
        itemsOnTrack={itemsOnTrack}
        nextDeadlineDays={nextDeadlineDays}
        rating={4.7}
        reviewCount={14}
      />

      <HealthRow
        compliant={compliant}
        dueSoon={dueSoon}
        overdue={overdue}
        rentCollected={monthlyIncome}
        rentExpected={monthlyIncome}
        month={monthName}
      />

      {/* Greeting — no card, just text */}
      <div>
        <h1 className="text-[22px] text-foreground tracking-tight font-medium">
          {greeting}, {LANDLORD_PROFILE.name.split(" ")[0]}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          {portfolio.length} properties · {totalTenants} tenants
        </p>
      </div>

      {/* KPI row — flat, no cards, hairline dividers */}
      <div className="grid grid-cols-2 md:grid-cols-4 hairline-t hairline-b">
        <Stat label="Properties" value={portfolio.length.toString()} />
        <Stat label="Monthly income" value={`£${monthlyIncome.toLocaleString()}`} />
        <Stat label="Compliance" value={`${avgCompliance}%`} />
        <Stat label="Alerts" value={criticalAlerts.length.toString()} tone={criticalAlerts.length > 0 ? "danger" : "default"} />
      </div>

      {/* Split: Your properties + What's coming up */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        <YourPropertiesSection />
        <WhatsComingUpSection />
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "danger" }) {
  return (
    <div className="px-5 py-4 hairline-r last:border-r-0">
      <p className="label-eyebrow mb-2">{label}</p>
      <p className={`text-[22px] tracking-tight tabular-nums font-medium ${tone === "danger" ? "text-danger" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
