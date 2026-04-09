import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowLeft, Building2, CheckSquare, Lock, MessageSquare,
  CreditCard, Star, User, AlertTriangle, ChevronRight, Check,
  FileText, Clock, Shield, Flame, Zap, FileWarning, Scale, CalendarClock,
} from "lucide-react";
import { ComplianceDonut } from "./ComplianceDonut";
import { StarRating } from "./StarRating";
import { TasksTab } from "./TasksTab";
import { VaultTab } from "./VaultTab";
import { CommsTab } from "./CommsTab";
import { PaymentsTab } from "./PaymentsTab";
import { ReviewsTab } from "./ReviewsTab";
import {
  TENANT_INFO, HMO_TENANTS, PROP_RATINGS, PROP_CONTRACT,
  PAYMENTS_BY_PROP, RECURRING_PAYMENTS, DOC_VALIDITY_BY_PROP,
  VAULT_INIT, TASK_DATA, PHASES,
  type Property, type VaultDoc,
} from "@/data/constants";
import { getPropertyAlerts, getComplianceForProperty, getRAGColor, getRAGLabel } from "@/data/helpers";
import { useState } from "react";

type PropertyTab = "overview" | "tasks" | "vault" | "comms" | "payments" | "reviews";

interface PropertyDetailProps {
  property: Property;
  completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>;
  onBack: () => void;
}

export function PropertyDetail({ property: p, completed, allVaults, onBack }: PropertyDetailProps) {
  const [activeTab, setActiveTab] = useState<PropertyTab>("overview");
  const pct = getComplianceForProperty(p.id, "landlord", completed, allVaults, !!p.isHmo);
  const vault = allVaults[p.id] || VAULT_INIT;
  const alerts = getPropertyAlerts(p.id, vault);
  const ti = TENANT_INFO[p.id];
  const pr = PROP_RATINGS[p.id] || { rating: 0, count: 0 };
  const contract = PROP_CONTRACT[p.id];
  const hmoTenants = p.isHmo ? HMO_TENANTS[p.id] : null;

  const tabs: { id: PropertyTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "vault", label: "Vault", icon: Lock },
    { id: "comms", label: "Comms", icon: MessageSquare },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "reviews", label: "Reviews", icon: Star },
  ];

  return (
    <div className="space-y-6 pb-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to portfolio
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 shadow-card"
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-xl font-bold text-foreground">{p.address}</h1>
              {p.isHmo && (
                <span className="text-[10px] font-bold text-primary bg-landlord-light border border-primary/20 rounded-full px-2.5 py-0.5">HMO</span>
              )}
            </div>
            {pr.rating > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <StarRating rating={pr.rating} size={12} />
                <span className="text-xs font-bold text-foreground">{pr.rating}</span>
                <span className="text-[10px] text-muted-foreground">({pr.count} reviews)</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-3">
              <ComplianceDonut percentage={pct} size={48} strokeWidth={4} />
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Compliance</p>
                <p className={cn("text-sm font-bold", pct >= 80 ? "text-success" : pct >= 50 ? "text-warning" : "text-danger")}>
                  {getRAGLabel(pct)}
                </p>
              </div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-right">
              <p className="font-display text-xl font-bold text-foreground">£{p.rent.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">per month</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex gap-1 border-b border-border pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <OverviewTab property={p} pct={pct} alerts={alerts} ti={ti} contract={contract} hmoTenants={hmoTenants} completed={completed} vault={vault} />
      )}
      {activeTab === "tasks" && <TasksTab property={p} completed={completed} allVaults={allVaults} />}
      {activeTab === "vault" && <VaultTab property={p} allVaults={allVaults} />}
      {activeTab === "comms" && <CommsTab property={p} />}
      {activeTab === "payments" && <PaymentsTab property={p} />}
      {activeTab === "reviews" && <ReviewsTab property={p} />}
    </div>
  );
}

/* ─── Contextual alert icons ─── */
function getAlertIcon(alert: { text: string; type: string }) {
  const t = alert.text.toLowerCase();
  if (t.includes("gas")) return <Flame className="w-3.5 h-3.5" />;
  if (t.includes("epc") || t.includes("energy")) return <Zap className="w-3.5 h-3.5" />;
  if (t.includes("eicr") || t.includes("electrical")) return <Zap className="w-3.5 h-3.5" />;
  if (t.includes("deposit")) return <Shield className="w-3.5 h-3.5" />;
  if (t.includes("how to rent")) return <FileText className="w-3.5 h-3.5" />;
  if (t.includes("contract") || t.includes("renters' rights") || t.includes("act")) return <Scale className="w-3.5 h-3.5" />;
  if (alert.type === "doc") return <FileWarning className="w-3.5 h-3.5" />;
  return <AlertTriangle className="w-3.5 h-3.5" />;
}

/* ─── Overview Tab ─── */
function OverviewTab({
  property: p, pct, alerts, ti, contract, hmoTenants, completed, vault,
}: {
  property: Property; pct: number; alerts: any[]; ti: any; contract: any;
  hmoTenants: any; completed: Record<string, boolean>; vault: VaultDoc[];
}) {
  const isDocUp = (n: string) => vault.some(d => d.name === n && d.status === "uploaded");
  const isDone = (t: any) => completed[`${p.id}_${t.id}`] || (t.vaultDoc && isDocUp(t.vaultDoc));
  const curPhaseIdx = PHASES.findIndex(ph => {
    const tasks = (TASK_DATA["landlord"][ph] || []).filter((t: any) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || p.isHmo));
    return tasks.length > 0 && tasks.some((t: any) => !isDone(t));
  });
  const pendingTasks = (TASK_DATA["landlord"][PHASES[Math.max(curPhaseIdx, 0)]] || [])
    .filter((t: any) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || p.isHmo) && !isDone(t));

  const payments = PAYMENTS_BY_PROP[p.id] || [];
  const missedCount = payments.filter(pm => pm.status === "missed").length;
  const recurring = RECURRING_PAYMENTS[p.id] || [];

  const phaseProgress = PHASES.map((ph) => {
    const tasks = (TASK_DATA["landlord"][ph] || []).filter((t: any) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || p.isHmo));
    const done = tasks.filter(isDone).length;
    return { name: ph, done, total: tasks.length, allDone: tasks.length > 0 && done === tasks.length, pct: tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0 };
  });

  const docValidity = DOC_VALIDITY_BY_PROP[p.id] || {};
  const deadlines = Object.entries(docValidity)
    .filter(([, v]) => v.days > 0 && v.days <= 365)
    .map(([name, v]) => ({ label: name, ...v }))
    .sort((a, b) => a.days - b.days);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5">
      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3">
        <QuickStat icon={<Shield className="w-4 h-4" />} label="Compliance" value={`${pct}%`}
          color={pct >= 80 ? "text-success" : pct >= 50 ? "text-warning" : "text-danger"}
          bgColor={pct >= 80 ? "bg-success/10" : pct >= 50 ? "bg-warning/10" : "bg-danger/10"} />
        <QuickStat icon={<AlertTriangle className="w-4 h-4" />} label="Alerts" value={alerts.length.toString()}
          color={alerts.length > 0 ? "text-danger" : "text-success"}
          bgColor={alerts.length > 0 ? "bg-danger/10" : "bg-success/10"} />
        <QuickStat icon={<CreditCard className="w-4 h-4" />} label="Payments"
          value={missedCount > 0 ? `${missedCount} missed` : "On track"}
          color={missedCount > 0 ? "text-danger" : "text-success"}
          bgColor={missedCount > 0 ? "bg-danger/10" : "bg-success/10"} />
        <QuickStat icon={<CheckSquare className="w-4 h-4" />} label="Tasks" value={`${pendingTasks.length} pending`}
          color={pendingTasks.length > 0 ? "text-primary" : "text-success"}
          bgColor={pendingTasks.length > 0 ? "bg-primary/10" : "bg-success/10"} />
      </div>

      {/* Tenant + Alerts + Lifecycle — single row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Tenant — compact inline */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-primary" />
            {hmoTenants ? `Tenants (${hmoTenants.length})` : "Tenant"}
          </h3>
          {hmoTenants ? (
            <div className="space-y-1.5">
              {hmoTenants.map((ht: any) => (
                <div key={ht.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg bg-secondary/40">
                  <img src={ht.avatarUrl} alt={ht.name} className="w-7 h-7 rounded-full object-cover ring-1 ring-border" />
                  <span className="text-xs font-medium text-foreground flex-1 truncate">{ht.name}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-warning" fill="currentColor" />
                    <span className="text-[10px] font-bold text-foreground">{ht.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : ti ? (
            <div className="flex items-center gap-3">
              <img src={ti.avatarUrl} alt={ti.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-border" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-foreground">{ti.name}</span>
                  {ti.verified && <span className="text-[8px] font-semibold text-success bg-success-muted rounded px-1 py-0.5">✓</span>}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <StarRating rating={ti.rating} size={10} />
                  <span className="text-[10px] font-bold text-foreground">{ti.rating}</span>
                </div>
                {contract && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{contract.start} → {contract.end}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No tenant assigned</p>
          )}
        </div>

        {/* Alerts — compact */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className={cn("w-3.5 h-3.5", alerts.length > 0 ? "text-danger" : "text-success")} />
              Alerts
            </h3>
            {alerts.length > 0 && (
              <span className="text-[9px] font-bold bg-danger text-primary-foreground rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                {alerts.length}
              </span>
            )}
          </div>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 py-2 justify-center">
              <Check className="w-3.5 h-3.5 text-success" />
              <p className="text-[10px] text-success font-medium">All clear</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {alerts.map((a, i) => (
                <div key={i} className={cn(
                  "flex items-start gap-2 p-2 rounded-lg",
                  a.severity === "high" ? "bg-danger/10" : "bg-warning/10"
                )}>
                  <div className={cn("mt-0.5 shrink-0", a.severity === "high" ? "text-danger" : "text-warning")}>
                    {getAlertIcon(a)}
                  </div>
                  <p className="text-[11px] font-medium text-foreground leading-snug">{a.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lifecycle — current phase only */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-primary" />
              Lifecycle
            </h3>
            <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full",
              pendingTasks.length > 0 ? "text-primary bg-primary/10" : "text-success bg-success-muted"
            )}>
              {curPhaseIdx >= 0 ? PHASES[curPhaseIdx] : "Complete"}
            </span>
          </div>

          {/* Mini phase dots */}
          <div className="flex items-center gap-1 mb-3">
            {phaseProgress.map((ph, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={cn("w-2 h-2 rounded-full",
                  ph.allDone ? "bg-success" : i === curPhaseIdx ? "bg-primary" : "bg-border"
                )} />
                <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", ph.allDone ? "bg-success" : ph.pct > 0 ? "bg-primary" : "")}
                    style={{ width: `${ph.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Next actions */}
          {pendingTasks.length > 0 && (
            <div className="space-y-1">
              {pendingTasks.slice(0, 3).map((t: any) => (
                <div key={t.id} className="flex items-center gap-2 py-1 px-2 rounded-lg bg-secondary/40">
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", t.type === "legal" ? "bg-danger" : "bg-info")} />
                  <span className="text-[10px] font-medium text-foreground flex-1 truncate">{t.label}</span>
                </div>
              ))}
              {pendingTasks.length > 3 && (
                <p className="text-[9px] text-primary font-semibold pl-2">+{pendingTasks.length - 3} more →</p>
              )}
            </div>
          )}
        </div>

      {/* Deadlines + Payments — side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
            <CalendarClock className="w-3.5 h-3.5 text-warning" />
            Upcoming Deadlines
          </h3>
          {deadlines.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No upcoming deadlines</p>
          ) : (
            <div className="space-y-1.5">
              {deadlines.slice(0, 4).map((d, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg bg-secondary/40">
                  <Clock className={cn("w-3 h-3 shrink-0", d.days <= 90 ? "text-warning" : "text-muted-foreground")} />
                  <span className="text-xs font-medium text-foreground flex-1 truncate">{d.label}</span>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                    d.status === "expired" ? "text-danger bg-danger-muted" :
                    d.days <= 90 ? "text-warning bg-warning-muted" : "text-muted-foreground bg-secondary"
                  )}>{d.status === "expired" ? "Expired" : `${d.days}d`}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
            <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
            Payments
          </h3>
          {recurring.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No payments set up</p>
          ) : (
            <div className="space-y-1.5">
              {recurring.slice(0, 3).map((rp) => (
                <div key={rp.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-secondary/40">
                  <span className="text-xs font-medium text-foreground truncate flex-1 mr-2">{rp.label}</span>
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                    rp.status === "paid" ? "text-success bg-success-muted" :
                    rp.status === "overdue" ? "text-danger bg-danger-muted" : "text-warning bg-warning-muted"
                  )}>{rp.status === "paid" ? "Paid" : rp.status === "overdue" ? "Overdue" : "Due soon"}</span>
                </div>
              ))}
              {recurring.length > 3 && (
                <p className="text-[10px] text-primary font-semibold pl-2 cursor-pointer hover:underline">+{recurring.length - 3} more →</p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function QuickStat({ icon, label, value, color, bgColor }: {
  icon: React.ReactNode; label: string; value: string; color: string; bgColor: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border px-3.5 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", bgColor, color)}>{icon}</div>
      </div>
      <p className={cn("font-display text-lg font-bold", color)}>{value}</p>
    </div>
  );
}