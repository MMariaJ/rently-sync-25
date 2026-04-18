import { motion } from "framer-motion";
import {
  Building2, TrendingUp, AlertTriangle, Shield,
  ChevronRight, Star, Sparkles, CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ComplianceDonut } from "./ComplianceDonut";
import { StarRating } from "./StarRating";
import { DeadlineCalendar, type DeadlineDate } from "./DeadlineCalendar";
import {
  TENANT_INFO, HMO_TENANTS, VAULT_INIT,
  LANDLORD_PROFILE, PROP_RATINGS, DOC_VALIDITY_BY_PROP,
  type Property, type VaultDoc,
} from "@/data/constants";
import { getPropertyAlerts, getComplianceForProperty } from "@/data/helpers";

// An alert is "critical" only when truly overdue / expired / missing.
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

  const allRatings = portfolio.map(p => PROP_RATINGS[p.id]).filter(Boolean);
  const totalReviews = allRatings.reduce((s, r) => s + r.count, 0);
  const weightedRating = totalReviews > 0
    ? allRatings.reduce((s, r) => s + r.rating * r.count, 0) / totalReviews
    : 0;

  // Aggregate deadlines across all properties for the dashboard calendar
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

  return (
    <div className="space-y-5 pb-12">
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-6 text-primary-foreground"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary-foreground)/0.08),transparent_60%)]" />
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-primary-foreground/5" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={LANDLORD_PROFILE.avatarUrl} alt={LANDLORD_PROFILE.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-foreground/20 shadow-lg" />
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight">
                {greeting}, {LANDLORD_PROFILE.name.split(" ")[0]}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={weightedRating} size={14} />
                <span className="text-sm font-semibold">{weightedRating.toFixed(1)}</span>
                <span className="text-xs text-primary-foreground/60">({totalReviews} reviews)</span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-4 py-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">{portfolio.length} properties · {totalTenants} tenants</span>
          </div>
        </div>
      </motion.div>

      {/* 4 KPI cards — rounder, softer */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.06 }}
      >
        <KPICard label="Properties" value={portfolio.length.toString()}
          icon={<Building2 className="w-4 h-4" />} />
        <KPICard label="Monthly Income" value={`£${monthlyIncome.toLocaleString()}`}
          icon={<TrendingUp className="w-4 h-4" />} />
        <KPICard label="Compliance" value={`${avgCompliance}%`}
          icon={<ComplianceDonut percentage={avgCompliance} size={24} strokeWidth={3} showLabel={false} />} />
        <KPICard label="Action Items" value={criticalAlerts.length.toString()}
          icon={<AlertTriangle className="w-4 h-4" />} />
      </motion.div>

      {/* Split: Property overview (left) + Deadlines calendar (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Property overview */}
        <motion.div
          className="bg-card rounded-3xl border border-border p-5 shadow-card"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-primary" /> Property overview
            </h2>
            <button onClick={onNavigateToProperties} className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {portfolio.map((p) => {
              const pct = getComplianceForProperty(p.id, "landlord", completed, allVaults, !!p.isHmo);
              const pr = PROP_RATINGS[p.id] || { rating: 0, count: 0 };
              const propAlerts = getPropertyAlerts(p.id, allVaults[p.id] || VAULT_INIT);
              const critCount = propAlerts.filter(isCritical).length;
              const warnCount = propAlerts.length - critCount;

              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProperty(p.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border bg-card text-left transition-all hover:shadow-card hover:-translate-y-0.5 hover:border-border/80 group"
                >
                  <ComplianceDonut percentage={pct} size={40} strokeWidth={4} showLabel />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.address.split(",")[0]}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-warning" fill="currentColor" />
                      <span className="text-[11px] font-bold text-foreground">{pr.rating}</span>
                      <span className="text-[10px] text-muted-foreground">({pr.count})</span>
                    </div>
                  </div>

                  {/* Alert pills — compact, color-coded count badges */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {propAlerts.length === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success bg-success-muted rounded-full px-2 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />
                        All clear
                      </span>
                    ) : (
                      <>
                        {critCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-danger bg-danger-muted rounded-full px-2 py-1 tabular-nums">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {critCount} critical
                          </span>
                        )}
                        {warnCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warning bg-warning-muted rounded-full px-2 py-1 tabular-nums">
                            {warnCount} review
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Portfolio deadlines calendar */}
        <motion.div
          className="bg-card rounded-3xl border border-border p-5 shadow-card"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.18 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <CalendarClock className="w-3.5 h-3.5 text-primary" /> Portfolio deadlines
            </h2>
            <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {allDeadlines.length}
            </span>
          </div>
          {allDeadlines.length > 0 ? (
            <DeadlineCalendar dates={allDeadlines} upcomingLimit={5} />
          ) : (
            <p className="text-xs text-muted-foreground">No upcoming deadlines.</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function KPICard({ label, value, icon }: {
  label: string; value: string; icon: React.ReactNode;
}) {
  return (
    <div className="relative rounded-3xl border border-info/20 px-4 py-3.5 shadow-card overflow-hidden bg-gradient-to-br from-info-muted/60 via-card to-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center bg-info-muted text-info")}>{icon}</div>
      </div>
      <p className="font-display text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
