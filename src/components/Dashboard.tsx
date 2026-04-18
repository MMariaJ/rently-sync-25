import { ChevronRight } from "lucide-react";
import { ComplianceDonut } from "./ComplianceDonut";
import { DeadlineCalendar, type DeadlineDate } from "./DeadlineCalendar";
import { HeroHealthyCard } from "./HeroHealthyCard";
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
  const itemsOnTrack = portfolio.reduce((s, p) => {
    const validity = DOC_VALIDITY_BY_PROP[p.id] || {};
    return s + Object.values(validity).filter((v) => v.status !== "expired").length;
  }, 0);
  const nextDeadlineDays = allDeadlines[0]?.days ?? 0;

  return (
    <div className="space-y-8 pb-12">
      {isHealthy && (
        <HeroHealthyCard
          itemsOnTrack={itemsOnTrack}
          nextDeadlineDays={nextDeadlineDays}
          rating={4.7}
          reviewCount={14}
        />
      )}

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

      {/* Split: Property overview + Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-card hairline rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="label-eyebrow">Property overview</h2>
            <button onClick={onNavigateToProperties} className="text-[12px] text-primary hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="-mx-5">
            {portfolio.map((p, idx) => {
              const pct = getComplianceForProperty(p.id, "landlord", completed, allVaults, !!p.isHmo);
              const propAlerts = getPropertyAlerts(p.id, allVaults[p.id] || VAULT_INIT);
              const critCount = propAlerts.filter(isCritical).length;
              const warnCount = propAlerts.length - critCount;

              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProperty(p.id)}
                  className={`w-full flex items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-secondary/40 ${idx > 0 ? "hairline-t" : ""}`}
                >
                  <ComplianceDonut percentage={pct} size={36} strokeWidth={3} showLabel={false} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-foreground truncate">{p.address.split(",")[0]}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5 tabular-nums">
                      {pct}% compliant
                      {propAlerts.length === 0 && " · all clear"}
                    </p>
                  </div>

                  {propAlerts.length > 0 && (
                    <div className="flex items-center gap-2 shrink-0 text-[12px] tabular-nums">
                      {critCount > 0 && (
                        <span className="text-danger">
                          {critCount} {critCount === 1 ? "alert" : "alerts"}
                        </span>
                      )}
                      {warnCount > 0 && (
                        <span className="text-muted-foreground">
                          {warnCount} to review
                        </span>
                      )}
                    </div>
                  )}

                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-card hairline rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="label-eyebrow">Portfolio deadlines</h2>
            <span className="text-[12px] text-muted-foreground tabular-nums">
              {allDeadlines.length} upcoming
            </span>
          </div>
          {allDeadlines.length > 0 ? (
            <DeadlineCalendar dates={allDeadlines} upcomingLimit={5} />
          ) : (
            <p className="text-[13px] text-muted-foreground">No upcoming deadlines.</p>
          )}
        </section>
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
