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

  const upcomingDeadlines = portfolio.flatMap(p => {
    const validity = DOC_VALIDITY_BY_PROP[p.id] || {};
    const propLabel = p.address.split(",")[0];
    return Object.entries(validity)
      .filter(([, v]) => v.days > 0 && v.days <= 180)
      .map(([doc, v]) => ({ property: propLabel, propId: p.id, doc, ...v }));
  }).sort((a, b) => a.days - b.days);

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

      {/* 2:1 layout — left (alerts) : right (compliance+ratings & deadlines) */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }}
      >
        {/* Left — Alerts (spans 2 cols) */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h2 className="font-display text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-danger" /> Alerts
            <span className="ml-auto text-muted-foreground font-normal normal-case tracking-normal">{allAlerts.length}</span>
          </h2>
          {allAlerts.length > 0 ? (
            <div className="space-y-0.5 max-h-56 overflow-y-auto">
              {allAlerts.map((a, i) => (
                <button key={i} onClick={() => onSelectProperty(a.propId)}
                  className="w-full flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-secondary/50 transition-colors text-left group">
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", a.severity === "high" ? "bg-danger" : "bg-warning")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{a.text}</p>
                    <p className="text-[10px] text-muted-foreground">{a.property}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                    a.severity === "high" ? "bg-danger-muted text-danger" : "bg-warning-muted text-warning"
                  )}>{a.severity}</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-foreground transition-colors shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No active alerts</p>
          )}
        </div>

        {/* Right — Deadlines */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-display text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
            <Calendar className="w-3.5 h-3.5 text-warning" /> Deadlines
          </h2>
          {upcomingDeadlines.length > 0 ? (
            <div className="space-y-0.5">
              {upcomingDeadlines.slice(0, 4).map((d, i) => (
                <button key={i} onClick={() => onSelectProperty(d.propId)}
                  className="w-full flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-secondary/50 transition-colors text-left">
                  <Clock className={cn("w-3.5 h-3.5 shrink-0", d.days <= 90 ? "text-warning" : "text-muted-foreground")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{d.doc}</p>
                    <p className="text-[10px] text-muted-foreground">{d.property}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                    d.days <= 90 ? "bg-warning-muted text-warning" : "bg-secondary text-muted-foreground"
                  )}>{d.days}d</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No upcoming deadlines</p>
          )}
        </div>
      </motion.div>

      {/* Compliance + Ratings combined — full width */}
      <motion.div
        className="bg-card rounded-xl border border-border p-5"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.18 }}
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
            const alerts = getPropertyAlerts(p.id, allVaults[p.id] || VAULT_INIT);
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
                    {alerts.length > 0 && (
                      <span className="text-[10px] text-danger ml-auto">{alerts.length} alert{alerts.length !== 1 ? "s" : ""}</span>
                    )}
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
