import { motion } from "framer-motion";
import {
  Building2, TrendingUp, AlertTriangle, Shield, Calendar,
  ChevronRight, Clock, FileText, ArrowUpRight, ArrowDownRight,
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

  // Upcoming deadlines from doc validity
  const upcomingDeadlines = portfolio.flatMap(p => {
    const validity = DOC_VALIDITY_BY_PROP[p.id] || {};
    const propLabel = p.address.split(",")[0];
    return Object.entries(validity)
      .filter(([, v]) => v.days > 0 && v.days <= 180)
      .map(([doc, v]) => ({ property: propLabel, propId: p.id, doc, ...v }));
  }).sort((a, b) => a.days - b.days);

  // Recent payments across properties
  const recentPayments = portfolio.flatMap(p => {
    const payments = PAYMENTS_BY_PROP[p.id] || [];
    const propLabel = p.address.split(",")[0];
    return payments.slice(0, 2).map(pm => ({ ...pm, property: propLabel, propId: p.id }));
  }).slice(0, 5);

  const missedPaymentsTotal = portfolio.reduce((s, p) => {
    return s + (PAYMENTS_BY_PROP[p.id] || []).filter(pm => pm.status === "missed").length;
  }, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-end justify-between mb-6">
          <div className="flex items-center gap-4">
            <img src={LANDLORD_PROFILE.avatarUrl} alt={LANDLORD_PROFILE.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-border" />
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Portfolio overview — {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI cards */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
      >
        <KPICard
          label="Properties"
          value={portfolio.length.toString()}
          icon={<Building2 className="w-4 h-4" />}
          color="text-primary"
          bgColor="bg-landlord-light"
          subtitle={`${totalTenants} active tenant${totalTenants !== 1 ? "s" : ""}`}
        />
        <KPICard
          label="Monthly Income"
          value={`£${monthlyIncome.toLocaleString()}`}
          icon={<TrendingUp className="w-4 h-4" />}
          color="text-success"
          bgColor="bg-success-muted"
          subtitle={missedPaymentsTotal > 0 ? `${missedPaymentsTotal} missed` : "All on track"}
          subtitleColor={missedPaymentsTotal > 0 ? "text-danger" : undefined}
        />
        <KPICard
          label="Avg. Compliance"
          value={`${avgCompliance}%`}
          icon={<ComplianceDonut percentage={avgCompliance} size={28} strokeWidth={3} showLabel={false} />}
          color={avgCompliance >= 80 ? "text-success" : avgCompliance >= 50 ? "text-warning" : "text-danger"}
          bgColor={avgCompliance >= 80 ? "bg-success-muted" : avgCompliance >= 50 ? "bg-warning-muted" : "bg-danger-muted"}
          subtitle={getRAGLabel(avgCompliance)}
        />
        <KPICard
          label="Action Items"
          value={highAlerts.length.toString()}
          icon={<AlertTriangle className="w-4 h-4" />}
          color={highAlerts.length > 0 ? "text-danger" : "text-success"}
          bgColor={highAlerts.length > 0 ? "bg-danger-muted" : "bg-success-muted"}
          subtitle={highAlerts.length > 0 ? "High priority" : "All clear"}
        />
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — Alerts + Compliance per property */}
        <motion.div
          className="lg:col-span-3 space-y-6"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
        >
          {/* Alerts */}
          {allAlerts.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-danger" /> Active Alerts
                </h2>
                <span className="text-xs text-muted-foreground">{allAlerts.length} total</span>
              </div>
              <div className="space-y-2">
                {allAlerts.slice(0, 5).map((a, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectProperty(a.propId)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left group"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      a.severity === "high" ? "bg-danger" : "bg-warning"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{a.text}</p>
                      <p className="text-xs text-muted-foreground">{a.property}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                      a.severity === "high" ? "bg-danger-muted text-danger" : "bg-warning-muted text-warning"
                    )}>
                      {a.severity}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Per-property compliance */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Compliance by Property
              </h2>
              <button onClick={onNavigateToProperties} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {portfolio.map(p => {
                const pct = getComplianceForProperty(p.id, "landlord", completed, allVaults, !!p.isHmo);
                const alerts = getPropertyAlerts(p.id, allVaults[p.id] || VAULT_INIT);
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectProperty(p.id)}
                    className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors group"
                  >
                    <ComplianceDonut percentage={pct} size={36} strokeWidth={3} showLabel={false} />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-foreground truncate">{p.address.split(",")[0]}</p>
                      <p className="text-xs text-muted-foreground">
                        {pct}% compliant · {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: getRAGColor(pct) }} />
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Right — Deadlines + Recent payments */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}
        >
          {/* Upcoming deadlines */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-warning" /> Upcoming Deadlines
            </h2>
            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-2">
                {upcomingDeadlines.slice(0, 5).map((d, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectProperty(d.propId)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                      d.status === "expiring" ? "bg-warning-muted text-warning" : "bg-secondary text-muted-foreground"
                    )}>
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{d.doc}</p>
                      <p className="text-xs text-muted-foreground">{d.property} · {d.expiry}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5",
                      d.days <= 90 ? "bg-warning-muted text-warning" : "bg-secondary text-muted-foreground"
                    )}>
                      {d.days}d
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming deadlines</p>
            )}
          </div>

          {/* Recent payments */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-success" /> Recent Payments
            </h2>
            {recentPayments.length > 0 ? (
              <div className="space-y-2">
                {recentPayments.map((pm, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      pm.status === "paid" ? "bg-success-muted text-success" :
                        pm.status === "missed" ? "bg-danger-muted text-danger" :
                          "bg-warning-muted text-warning"
                    )}>
                      {pm.status === "paid" ? <ArrowUpRight className="w-3.5 h-3.5" /> :
                        pm.status === "missed" ? <ArrowDownRight className="w-3.5 h-3.5" /> :
                          <Clock className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{pm.property}</p>
                      <p className="text-xs text-muted-foreground">{pm.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">£{pm.amount.toLocaleString()}</p>
                      <p className={cn(
                        "text-[10px] font-semibold",
                        pm.status === "paid" ? "text-success" : pm.status === "missed" ? "text-danger" : "text-warning"
                      )}>
                        {pm.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No payment data</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function KPICard({ label, value, icon, color, bgColor, subtitle, subtitleColor }: {
  label: string; value: string; icon: React.ReactNode;
  color: string; bgColor: string; subtitle?: string; subtitleColor?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bgColor, color)}>
          {icon}
        </div>
      </div>
      <p className={cn("font-display text-2xl font-bold", color)}>{value}</p>
      {subtitle && <p className={cn("text-xs mt-0.5", subtitleColor || "text-muted-foreground")}>{subtitle}</p>}
    </div>
  );
}
