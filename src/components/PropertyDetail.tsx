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
  VAULT_INIT, TASK_DATA, PHASES, PROP_PHOTOS,
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

/* ─── Decide whether an alert truly warrants the red 'danger' tone ─── */
function isCritical(a: { text: string; severity: "high" | "medium"; type: string }) {
  if (a.severity !== "high") return false;
  const t = a.text.toLowerCase();
  return t.includes("overdue") || t.includes("expired") || t.includes("missing");
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
  const activePhase = curPhaseIdx >= 0 ? PHASES[curPhaseIdx] : "Complete";
  const pendingTasks = (TASK_DATA["landlord"][PHASES[Math.max(curPhaseIdx, 0)]] || [])
    .filter((t: any) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || p.isHmo) && !isDone(t));

  const recurring = RECURRING_PAYMENTS[p.id] || [];

  const phaseProgress = PHASES.map((ph) => {
    const tasks = (TASK_DATA["landlord"][ph] || []).filter((t: any) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || p.isHmo));
    const done = tasks.filter(isDone).length;
    return { name: ph, done, total: tasks.length, allDone: tasks.length > 0 && done === tasks.length, pct: tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0 };
  });

  const docValidity = DOC_VALIDITY_BY_PROP[p.id] || {};
  const deadlines = Object.entries(docValidity)
    .filter(([, v]) => v.status === "expired" || (v.days > 0 && v.days <= 365))
    .map(([name, v]) => ({ label: name, ...v }))
    .sort((a, b) => a.days - b.days);

  const heroPhoto = (PROP_PHOTOS[p.id] && PROP_PHOTOS[p.id][0]) || null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5">
      {/* Hero row: Tenant + Property image (2/3) + Lifecycle (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tenant + property hero */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden shadow-card">
          <div className="grid grid-cols-1 md:grid-cols-5">
            {/* Property image */}
            {heroPhoto && (
              <div className="md:col-span-2 relative h-40 md:h-auto bg-secondary">
                <img src={heroPhoto.src} alt={heroPhoto.label} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2 text-[10px] font-semibold text-white/95 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  {heroPhoto.label}
                </span>
              </div>
            )}

            {/* Tenant info */}
            <div className={cn("p-5", heroPhoto ? "md:col-span-3" : "md:col-span-5")}>
              <h3 className="font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-primary" />
                {hmoTenants ? `Tenants (${hmoTenants.length})` : "Tenant"}
              </h3>

              {hmoTenants ? (
                <div className="space-y-2">
                  {hmoTenants.map((ht: any) => (
                    <div key={ht.id} className="flex items-center gap-3 py-2 px-2.5 rounded-lg bg-secondary/40">
                      <img src={ht.avatarUrl} alt={ht.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-border" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{ht.name}</p>
                        <p className="text-[10px] text-muted-foreground">Since {ht.since}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="w-3 h-3 text-warning" fill="currentColor" />
                        <span className="text-xs font-bold text-foreground">{ht.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : ti ? (
                <div className="flex items-start gap-4">
                  <img
                    src={ti.avatarUrl}
                    alt={ti.name}
                    className="w-20 h-20 rounded-2xl object-cover ring-2 ring-border shadow-card shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-lg font-bold text-foreground">{ti.name}</span>
                      {ti.verified && (
                        <span className="text-[9px] font-bold text-success bg-success-muted rounded-full px-1.5 py-0.5 inline-flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <StarRating rating={ti.rating} size={12} />
                      <span className="text-xs font-bold text-foreground">{ti.rating}</span>
                      <span className="text-[10px] text-muted-foreground">· Tenant since {ti.since}</span>
                    </div>
                    {contract && (
                      <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Tenancy</p>
                          <p className="text-xs font-semibold text-foreground mt-0.5">{contract.start} → {contract.end}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Rent</p>
                          <p className="text-xs font-semibold text-foreground mt-0.5">£{p.rent.toLocaleString()} / month</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No tenant assigned</p>
              )}
            </div>
          </div>
        </div>

        {/* Lifecycle stage tracker */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-primary" />
              Tenancy stage
            </h3>
            <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {activePhase}
            </span>
          </div>

          {/* Vertical stepper — clearer than dots */}
          <ol className="relative space-y-2.5 pl-1">
            {phaseProgress.map((ph, i) => {
              const isActive = i === curPhaseIdx;
              const isComplete = ph.allDone;
              const isFuture = !isActive && !isComplete && (curPhaseIdx >= 0 ? i > curPhaseIdx : false);

              return (
                <li key={ph.name} className="flex items-center gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all",
                      isComplete && "bg-success text-primary-foreground",
                      isActive && "bg-primary text-primary-foreground ring-4 ring-primary/15",
                      !isActive && !isComplete && "bg-secondary border border-border text-muted-foreground"
                    )}>
                      {isComplete ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <span className="text-[9px] font-bold">{i + 1}</span>
                      )}
                    </div>
                    {i < phaseProgress.length - 1 && (
                      <div className={cn(
                        "absolute top-5 left-1/2 -translate-x-1/2 w-0.5 h-3",
                        isComplete ? "bg-success/40" : "bg-border"
                      )} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs truncate",
                      isActive && "font-bold text-foreground",
                      isComplete && "font-medium text-foreground",
                      isFuture && "text-muted-foreground"
                    )}>{ph.name}</p>
                    {ph.total > 0 && (isActive || isComplete) && (
                      <p className="text-[10px] text-muted-foreground">{ph.done}/{ph.total} tasks</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {pendingTasks.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Next up</p>
              <p className="text-xs font-medium text-foreground line-clamp-2">{pendingTasks[0].label}</p>
              {pendingTasks.length > 1 && (
                <p className="text-[10px] text-primary font-semibold mt-1">+{pendingTasks.length - 1} more in this stage</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Compact KPI strip — restored but smaller */}
      <div className="grid grid-cols-4 gap-3">
        <QuickStat icon={<Shield className="w-4 h-4" />} label="Compliance" value={`${pct}%`}
          color={pct >= 80 ? "text-success" : pct >= 50 ? "text-warning" : "text-danger"}
          bgColor={pct >= 80 ? "bg-success/10" : pct >= 50 ? "bg-warning/10" : "bg-danger/10"} />
        <QuickStat icon={<AlertTriangle className="w-4 h-4" />} label="Alerts" value={alerts.length.toString()}
          color={alerts.some(isCritical) ? "text-danger" : alerts.length > 0 ? "text-warning" : "text-success"}
          bgColor={alerts.some(isCritical) ? "bg-danger/10" : alerts.length > 0 ? "bg-warning/10" : "bg-success/10"} />
        <QuickStat icon={<CalendarClock className="w-4 h-4" />} label="Next deadline"
          value={deadlines[0] ? (deadlines[0].status === "expired" ? "Overdue" : `${deadlines[0].days}d`) : "—"}
          color={deadlines[0]?.status === "expired" ? "text-danger" : (deadlines[0] && deadlines[0].days <= 90) ? "text-warning" : "text-foreground"}
          bgColor={deadlines[0]?.status === "expired" ? "bg-danger/10" : (deadlines[0] && deadlines[0].days <= 90) ? "bg-warning/10" : "bg-secondary"} />
        <QuickStat icon={<CheckSquare className="w-4 h-4" />} label="Tasks" value={`${pendingTasks.length} pending`}
          color={pendingTasks.length > 0 ? "text-primary" : "text-success"}
          bgColor={pendingTasks.length > 0 ? "bg-primary/10" : "bg-success/10"} />
      </div>

      {/* Alerts + Deadlines + Payments — three column row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alerts — softened palette */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className={cn("w-3.5 h-3.5", alerts.some(isCritical) ? "text-danger" : alerts.length > 0 ? "text-warning" : "text-success")} />
              Alerts
            </h3>
            {alerts.length > 0 && (
              <span className={cn(
                "text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1",
                alerts.some(isCritical) ? "bg-danger text-primary-foreground" : "bg-warning text-warning-foreground"
              )}>
                {alerts.length}
              </span>
            )}
          </div>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 py-3 justify-center">
              <Check className="w-3.5 h-3.5 text-success" />
              <p className="text-[11px] text-success font-medium">All clear</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {alerts.map((a, i) => {
                const critical = isCritical(a);
                return (
                  <div key={i} className={cn(
                    "flex items-start gap-2 p-2 rounded-lg border",
                    critical ? "bg-danger/5 border-danger/20" : "bg-warning/5 border-warning/20"
                  )}>
                    <div className={cn("mt-0.5 shrink-0", critical ? "text-danger" : "text-warning")}>
                      {getAlertIcon(a)}
                    </div>
                    <p className="text-[11px] font-medium text-foreground leading-snug">{a.text}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Deadlines */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
            <CalendarClock className="w-3.5 h-3.5 text-primary" />
            Upcoming Deadlines
          </h3>
          {deadlines.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No upcoming deadlines</p>
          ) : (
            <div className="space-y-1.5">
              {deadlines.slice(0, 4).map((d, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg bg-secondary/40">
                  <Clock className={cn("w-3 h-3 shrink-0",
                    d.status === "expired" ? "text-danger" : d.days <= 90 ? "text-warning" : "text-muted-foreground"
                  )} />
                  <span className="text-xs font-medium text-foreground flex-1 truncate">{d.label}</span>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                    d.status === "expired" ? "text-danger bg-danger-muted" :
                    d.days <= 90 ? "text-warning bg-warning-muted" : "text-muted-foreground bg-secondary"
                  )}>{d.status === "expired" ? "Overdue" : `${d.days}d`}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payments */}
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