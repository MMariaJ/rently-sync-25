import { motion } from "framer-motion";
import {
  Building2, TrendingUp, AlertTriangle, Shield, CalendarClock,
  ChevronRight, Star, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ComplianceDonut } from "./ComplianceDonut";
import { StarRating } from "./StarRating";
import {
  TENANT_INFO, HMO_TENANTS, VAULT_INIT,
  LANDLORD_PROFILE, PROP_RATINGS, DOC_VALIDITY_BY_PROP,
  type Property, type VaultDoc,
} from "@/data/constants";
import { getPropertyAlerts, getComplianceForProperty } from "@/data/helpers";

// An alert is "critical" only when truly overdue / expired / missing.
// "Expiring soon" lives on the property page, not the dashboard summary.
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

  // (calendar + chart removed; deadlines surface inside the merged property card)

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
        <KPICard label="Action Items" value={criticalAlerts.length.toString()}
          icon={<AlertTriangle className="w-4 h-4" />}
          color={criticalAlerts.length > 0 ? "text-danger" : "text-success"}
          bgColor={criticalAlerts.length > 0 ? "bg-danger-muted" : "bg-success-muted"} />
      </motion.div>

      {/* Merged: Property compliance + ratings + key alerts */}
      <motion.div
        className="bg-card rounded-xl border border-border p-5"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {portfolio.map((p) => {
            const pct = getComplianceForProperty(p.id, "landlord", completed, allVaults, !!p.isHmo);
            const pr = PROP_RATINGS[p.id] || { rating: 0, count: 0 };
            const propAlerts = getPropertyAlerts(p.id, allVaults[p.id] || VAULT_INIT);
            const keyAlerts = propAlerts
              .filter((a) => isCritical(a) || a.severity === "high")
              .sort((a, b) => (isCritical(a) === isCritical(b) ? 0 : isCritical(a) ? -1 : 1))
              .slice(0, 2);

            const validity = DOC_VALIDITY_BY_PROP[p.id] || {};
            // Surface a deadline that ISN'T already mentioned in the alerts above,
            // so we don't duplicate "EPC expired" / "Gas Safety expiring" lines.
            const alertText = keyAlerts.map(a => a.text.toLowerCase()).join(" ");
            const isMentioned = (docName: string) => {
              const key = docName.toLowerCase().split(" ")[0]; // "gas", "epc", "eicr"...
              return alertText.includes(key);
            };
            const nextDeadline = Object.entries(validity)
              .filter(([name, v]) =>
                (v.status === "expired" || v.days > 0) && !isMentioned(name)
              )
              .sort(([, a], [, b]) => a.days - b.days)[0];

            return (
              <button
                key={p.id}
                onClick={() => onSelectProperty(p.id)}
                className="relative flex flex-col gap-3 p-4 rounded-xl border border-border bg-card text-left transition-all hover:shadow-card hover:-translate-y-0.5 hover:border-border/80 group overflow-hidden"
              >
                <div className="flex items-start gap-3">
                  <ComplianceDonut percentage={pct} size={44} strokeWidth={4} showLabel />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.address.split(",")[0]}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-warning" fill="currentColor" />
                      <span className="text-[11px] font-bold text-foreground">{pr.rating}</span>
                      <span className="text-[10px] text-muted-foreground">({pr.count})</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground transition-colors shrink-0 mt-1" />
                </div>

                <div className="space-y-1 min-h-[40px]">
                  {keyAlerts.length === 0 ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      All clear
                    </div>
                  ) : (
                    keyAlerts.map((a, i) => {
                      const critical = isCritical(a);
                      return (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                            critical ? "bg-danger" : "bg-warning"
                          )} />
                          <p className="text-[11px] leading-snug line-clamp-2 text-foreground/80">
                            {a.text}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-2 mt-auto border-t border-border/60 flex items-center gap-1.5">
                  <CalendarClock className="w-3 h-3 text-muted-foreground shrink-0" />
                  {nextDeadline ? (
                    <>
                      <span className="text-[10px] text-muted-foreground truncate flex-1">{nextDeadline[0]}</span>
                      <span className={cn(
                        "text-[10px] font-semibold tabular-nums shrink-0",
                        nextDeadline[1].status === "expired" ? "text-danger" :
                        nextDeadline[1].days <= 90 ? "text-warning" : "text-muted-foreground"
                      )}>
                        {nextDeadline[1].status === "expired" ? "Overdue" : `Due ${nextDeadline[1].expiry}`}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">No upcoming deadlines</span>
                  )}
                </div>
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
