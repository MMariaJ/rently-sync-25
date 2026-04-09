import { motion } from "framer-motion";
import {
  Building2, TrendingUp, AlertTriangle, Shield, Calendar,
  ChevronRight, Clock, FileText, ArrowUpRight, ArrowDownRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ComplianceDonut } from "./ComplianceDonut";
import {
  PORTFOLIO, TENANT_INFO, HMO_TENANTS, VAULT_INIT,
  PAYMENTS_BY_PROP, LANDLORD_PROFILE, DOC_VALIDITY_BY_PROP,
  type Property, type VaultDoc,
} from "@/data/constants";
import { getPropertyAlerts, getComplianceForProperty, getRAGColor, getRAGLabel } from "@/data/helpers";

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

  const upcomingDeadlines = portfolio.flatMap(p => {
    const validity = DOC_VALIDITY_BY_PROP[p.id] || {};
    const propLabel = p.address.split(",")[0];
    return Object.entries(validity)
      .filter(([, v]) => v.days > 0 && v.days <= 180)
      .map(([doc, v]) => ({ property: propLabel, propId: p.id, doc, ...v }));
  }).sort((a, b) => a.days - b.days);

  const recentPayments = portfolio.flatMap(p => {
    const payments = PAYMENTS_BY_PROP[p.id] || [];
    const propLabel = p.address.split(",")[0];
    return payments.slice(0, 2).map(pm => ({ ...pm, property: propLabel, propId: p.id }));
  }).slice(0, 5);

  const missedPaymentsTotal = portfolio.reduce((s, p) => {
    return s + (PAYMENTS_BY_PROP[p.id] || []).filter(pm => pm.status === "missed").length;
  }, 0);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-8 pb-16">
      {/* Hero welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-8 text-primary-foreground"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary-foreground)/0.08),transparent_60%)]" />
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-primary-foreground/5" />
        <div className="absolute right-12 bottom-4 w-24 h-24 rounded-full bg-primary-foreground/5" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-5">
            <img
              src={LANDLORD_PROFILE.avatarUrl}
              alt={LANDLORD_PROFILE.name}
              className="w-14 h-14 rounded-full object-cover ring-3 ring-primary-foreground/20 shadow-lg"
            />
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                {greeting}, {LANDLORD_PROFILE.name.split(" ")[0]}
              </h1>
              <p className="text-primary-foreground/70 text-sm mt-1">
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-4 py-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">{portfolio.length} properties · {totalTenants} tenants</span>
          </div>
        </div>
      </motion.div>

      {/* KPI cards */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        <KPICard
          label="Properties"
          value={portfolio.length.toString()}
          icon={<Building2 className="w-5 h-5" />}
          color="text-primary"
          bgColor="bg-landlord-light"
          subtitle={`${totalTenants} active tenant${totalTenants !== 1 ? "s" : ""}`}
        />
        <KPICard
          label="Monthly Income"
          value={`£${monthlyIncome.toLocaleString()}`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="text-success"
          bgColor="bg-success-muted"
          subtitle={missedPaymentsTotal > 0 ? `${missedPaymentsTotal} missed` : "All on track"}
          subtitleColor={missedPaymentsTotal > 0 ? "text-danger" : undefined}
        />
        <KPICard
          label="Avg. Compliance"
          value={`${avgCompliance}%`}
          icon={<ComplianceDonut percentage={avgCompliance} size={32} strokeWidth={3} showLabel={false} />}
          color={avgCompliance >= 80 ? "text-success" : avgCompliance >= 50 ? "text-warning" : "text-danger"}
          bgColor={avgCompliance >= 80 ? "bg-success-muted" : avgCompliance >= 50 ? "bg-warning-muted" : "bg-danger-muted"}
          subtitle={getRAGLabel(avgCompliance)}
        />
        <KPICard
          label="Action Items"
          value={highAlerts.length.toString()}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={highAlerts.length > 0 ? "text-danger" : "text-success"}
          bgColor={highAlerts.length > 0 ? "bg-danger-muted" : "bg-success-muted"}
          subtitle={highAlerts.length > 0 ? "High priority" : "All clear"}
        />
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column */}
        <motion.div
          className="lg:col-span-3 space-y-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {/* Alerts */}
          {allAlerts.length > 0 && (
            <SectionCard
              title="Active Alerts"
              icon={<AlertTriangle className="w-4 h-4 text-danger" />}
              badge={`${allAlerts.length} total`}
            >
              <div className="divide-y divide-border">
                {allAlerts.slice(0, 5).map((a, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectProperty(a.propId)}
                    className="w-full flex items-center gap-4 py-3.5 px-1 hover:bg-secondary/40 transition-colors text-left group first:pt-0 last:pb-0"
                  >
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full shrink-0",
                      a.severity === "high" ? "bg-danger" : "bg-warning"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{a.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.property}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0",
                      a.severity === "high" ? "bg-danger-muted text-danger" : "bg-warning-muted text-warning"
                    )}>
                      {a.severity}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                  </button>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Compliance by property */}
          <SectionCard
            title="Compliance by Property"
            icon={<Shield className="w-4 h-4 text-primary" />}
            action={
              <button onClick={onNavigateToProperties} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            }
          >
            <div className="space-y-1">
              {portfolio.map(p => {
                const pct = getComplianceForProperty(p.id, "landlord", completed, allVaults, !!p.isHmo);
                const alerts = getPropertyAlerts(p.id, allVaults[p.id] || VAULT_INIT);
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectProperty(p.id)}
                    className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-secondary/50 transition-colors group"
                  >
                    <ComplianceDonut percentage={pct} size={40} strokeWidth={3.5} showLabel={false} />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-foreground truncate">{p.address.split(",")[0]}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pct}% compliant · {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: getRAGColor(pct) }} />
                      </div>
                      <span className="text-xs font-bold w-8 text-right" style={{ color: getRAGColor(pct) }}>{pct}%</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          </SectionCard>
        </motion.div>

        {/* Right column */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {/* Upcoming deadlines */}
          <SectionCard
            title="Upcoming Deadlines"
            icon={<Calendar className="w-4 h-4 text-warning" />}
          >
            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-1">
                {upcomingDeadlines.slice(0, 5).map((d, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectProperty(d.propId)}
                    className="w-full flex items-start gap-3.5 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                      d.status === "expiring" ? "bg-warning-muted text-warning" : "bg-secondary text-muted-foreground"
                    )}>
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{d.doc}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{d.property} · {d.expiry}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 mt-0.5",
                      d.days <= 90 ? "bg-warning-muted text-warning" : "bg-secondary text-muted-foreground"
                    )}>
                      {d.days}d
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState text="No upcoming deadlines" />
            )}
          </SectionCard>

          {/* Recent payments */}
          <SectionCard
            title="Recent Payments"
            icon={<FileText className="w-4 h-4 text-success" />}
          >
            {recentPayments.length > 0 ? (
              <div className="divide-y divide-border">
                {recentPayments.map((pm, i) => (
                  <div key={i} className="flex items-center gap-3.5 py-3.5 first:pt-0 last:pb-0">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                      pm.status === "paid" ? "bg-success-muted text-success" :
                        pm.status === "missed" ? "bg-danger-muted text-danger" :
                          "bg-warning-muted text-warning"
                    )}>
                      {pm.status === "paid" ? <ArrowUpRight className="w-4 h-4" /> :
                        pm.status === "missed" ? <ArrowDownRight className="w-4 h-4" /> :
                          <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{pm.property}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{pm.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">£{pm.amount.toLocaleString()}</p>
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-wider mt-0.5",
                        pm.status === "paid" ? "text-success" : pm.status === "missed" ? "text-danger" : "text-warning"
                      )}>
                        {pm.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No payment data" />
            )}
          </SectionCard>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Reusable sub-components ── */

function SectionCard({ title, icon, badge, action, children }: {
  title: string; icon: React.ReactNode; badge?: string;
  action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-2.5">
          {icon} {title}
        </h2>
        {badge && <span className="text-xs text-muted-foreground">{badge}</span>}
        {action}
      </div>
      {children}
    </div>
  );
}

function KPICard({ label, value, icon, color, bgColor, subtitle, subtitleColor }: {
  label: string; value: string; icon: React.ReactNode;
  color: string; bgColor: string; subtitle?: string; subtitleColor?: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-soft hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bgColor, color)}>
          {icon}
        </div>
      </div>
      <p className={cn("font-display text-3xl font-bold tracking-tight", color)}>{value}</p>
      {subtitle && <p className={cn("text-xs mt-1.5", subtitleColor || "text-muted-foreground")}>{subtitle}</p>}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
