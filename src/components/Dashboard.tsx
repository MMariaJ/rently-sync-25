import { motion } from "framer-motion";
import {
  Building2, TrendingUp, AlertTriangle, Shield, CalendarDays,
  ChevronRight, Star, Sparkles, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ComplianceDonut } from "./ComplianceDonut";
import { StarRating } from "./StarRating";
import { DeadlineCalendar, type DeadlineEvent } from "./DeadlineCalendar";
import { IncomeExpensesChart } from "./IncomeExpensesChart";
import {
  TENANT_INFO, HMO_TENANTS, VAULT_INIT,
  LANDLORD_PROFILE, DOC_VALIDITY_BY_PROP, PROP_RATINGS,
  type Property, type VaultDoc,
} from "@/data/constants";
import { getPropertyAlerts, getComplianceForProperty, getRAGColor } from "@/data/helpers";

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
  const highAlerts = allAlerts.filter(a => a.severity === "high");
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

  // Build calendar events from doc expiries (expired => today; mapped severity)
  const parseDate = (s: string): Date | null => {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };
  const today = new Date();
  const deadlineEvents: DeadlineEvent[] = portfolio.flatMap((p) => {
    const validity = DOC_VALIDITY_BY_PROP[p.id] || {};
    const propLabel = p.address.split(",")[0];
    return Object.entries(validity)
      .map(([doc, v]) => {
        const date = parseDate(v.expiry) || today;
        const severity: DeadlineEvent["severity"] =
          v.status === "expired" ? "high" : v.days <= 90 ? "medium" : "low";
        return {
          date: v.status === "expired" ? today : date,
          label: doc,
          property: propLabel,
          propId: p.id,
          severity,
        };
      });
  });
  const upcomingDeadlinesCount = deadlineEvents.filter(
    (e) => e.severity !== "low"
  ).length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-5 pb-12">
      {/* Hero banner — greeting + rating */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-6 text-primary-foreground"
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

      {/* 4 KPI cards in a row */}
      <motion.div
        className="grid grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.06 }}
      >
        <KPICard label="Properties" value={portfolio.length.toString()}
          icon={<Building2 className="w-4 h-4" />} color="text-primary" bgColor="bg-landlord-light" />
        <KPICard label="Monthly Income" value={`£${monthlyIncome.toLocaleString()}`}
          icon={<TrendingUp className="w-4 h-4" />} color="text-success" bgColor="bg-success-muted" />
        <KPICard label="Compliance" value={`${avgCompliance}%`}
          icon={<ComplianceDonut percentage={avgCompliance} size={24} strokeWidth={3} showLabel={false} />}
          color={avgCompliance >= 80 ? "text-success" : avgCompliance >= 50 ? "text-warning" : "text-danger"}
          bgColor={avgCompliance >= 80 ? "bg-success-muted" : avgCompliance >= 50 ? "bg-warning-muted" : "bg-danger-muted"} />
        <KPICard label="Action Items" value={highAlerts.length.toString()}
          icon={<AlertTriangle className="w-4 h-4" />}
          color={highAlerts.length > 0 ? "text-danger" : "text-success"}
          bgColor={highAlerts.length > 0 ? "bg-danger-muted" : "bg-success-muted"} />
      </motion.div>

      {/* Property-grouped alerts (replaces flat list) */}
      <motion.div
        className="bg-card rounded-xl border border-border p-5"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }}
      >
        <h2 className="font-display text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-danger" /> Alerts by property
          <span className="ml-auto text-muted-foreground font-normal normal-case tracking-normal">{allAlerts.length} open</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {portfolio.map((p) => {
            const propAlerts = getPropertyAlerts(p.id, allVaults[p.id] || VAULT_INIT);
            const high = propAlerts.filter((a) => a.severity === "high").length;
            const medium = propAlerts.length - high;
            const total = propAlerts.length;
            const tone = high > 0 ? "danger" : medium > 0 ? "warning" : "success";
            return (
              <button
                key={p.id}
                onClick={() => onSelectProperty(p.id)}
                className={cn(
                  "flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all text-left group",
                  tone === "danger" && "border-danger/20 bg-danger-muted/40 hover:bg-danger-muted/70",
                  tone === "warning" && "border-warning/20 bg-warning-muted/40 hover:bg-warning-muted/70",
                  tone === "success" && "border-border bg-secondary/30 hover:bg-secondary/60"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{p.address.split(",")[0]}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{p.address.split(",").slice(1).join(",").trim()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {total === 0 ? (
                    <span className="text-[10px] font-bold text-success uppercase tracking-wider">All clear</span>
                  ) : (
                    <span
                      className={cn(
                        "min-w-[28px] h-7 rounded-full px-2 flex items-center justify-center text-xs font-bold tabular-nums",
                        tone === "danger" ? "bg-danger text-primary-foreground" : "bg-warning text-warning-foreground"
                      )}
                    >
                      {total}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Calendar + Income/Expenses chart — 1:2 split */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.18 }}
      >
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-display text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
            <CalendarDays className="w-3.5 h-3.5 text-primary" /> Deadlines
            <span className="ml-auto text-muted-foreground font-normal normal-case tracking-normal">{upcomingDeadlinesCount} due</span>
          </h2>
          <DeadlineCalendar events={deadlineEvents} onSelectProperty={onSelectProperty} />
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h2 className="font-display text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
            <Wallet className="w-3.5 h-3.5 text-success" /> Income vs expenses
          </h2>
          <IncomeExpensesChart />
        </div>
      </motion.div>

      {/* Compliance + Ratings combined — full width */}
      <motion.div
        className="bg-card rounded-xl border border-border p-5"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.24 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary" /> Property Compliance & Ratings
          </h2>
          <button onClick={onNavigateToProperties} className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-0.5">
            View all <ChevronRight className="w-2.5 h-2.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {portfolio.map(p => {
            const pct = getComplianceForProperty(p.id, "landlord", completed, allVaults, !!p.isHmo);
            const pr = PROP_RATINGS[p.id] || { rating: 0, count: 0 };
            return (
              <button key={p.id} onClick={() => onSelectProperty(p.id)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors group text-left">
                <ComplianceDonut percentage={pct} size={36} strokeWidth={3} showLabel={false} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{p.address.split(",")[0]}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: getRAGColor(pct) }} />
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: getRAGColor(pct) }}>{pct}%</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-warning" fill="currentColor" />
                    <span className="text-[10px] font-semibold text-foreground">{pr.rating}</span>
                    <span className="text-[10px] text-muted-foreground">({pr.count})</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-foreground transition-colors shrink-0" />
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function KPICard({ label, value, icon, color, bgColor }: {
  label: string; value: string; icon: React.ReactNode;
  color: string; bgColor: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border px-3.5 py-3 shadow-soft">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", bgColor, color)}>{icon}</div>
      </div>
      <p className={cn("font-display text-xl font-bold", color)}>{value}</p>
    </div>
  );
}
