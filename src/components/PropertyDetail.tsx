import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowLeft, Building2, CheckSquare, Lock, MessageSquare,
  CreditCard, Star, User, AlertTriangle, ChevronRight, Check,
  FileText, Shield, Flame, Zap, FileWarning, Scale, CalendarClock,
} from "lucide-react";
import { ComplianceDonut } from "./ComplianceDonut";
import { DeadlineCalendar } from "./DeadlineCalendar";
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
import { getPropertyAlerts, getComplianceForProperty, getRAGLabel } from "@/data/helpers";
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

  // Parse deadline expiry strings (e.g. "13 Jun 2026") into Dates for the mini-calendar
  const deadlineDates = deadlines
    .map((d) => {
      const dt = new Date(d.expiry);
      return isNaN(dt.getTime()) ? null : { date: dt, label: d.label, status: d.status, days: d.days };
    })
    .filter(Boolean) as { date: Date; label: string; status: string; days: number }[];

  const heroPhoto = (PROP_PHOTOS[p.id] && PROP_PHOTOS[p.id][0]) || null;

  // Combine alerts + deadlines into a single, deduped list
  const combinedItems: { kind: "alert" | "deadline"; text: string; tone: "danger" | "warning" | "muted"; meta?: string; icon: React.ReactNode }[] = [
    ...alerts.map((a) => ({
      kind: "alert" as const,
      text: a.text,
      tone: (isCritical(a) ? "danger" : "warning") as "danger" | "warning",
      icon: getAlertIcon(a),
    })),
    ...deadlines
      .filter((d) => !alerts.some((a) => a.text.toLowerCase().includes(d.label.toLowerCase().split(" ")[0])))
      .map((d) => ({
        kind: "deadline" as const,
        text: d.label,
        tone: (d.status === "expired" ? "danger" : d.days <= 90 ? "warning" : "muted") as "danger" | "warning" | "muted",
        meta: d.status === "expired" ? "Overdue" : `${d.days}d`,
        icon: <Clock className="w-3.5 h-3.5" />,
      })),
  ];
  const criticalCount = combinedItems.filter((i) => i.tone === "danger").length;

  const paymentsSetup = recurring.length > 0;
  const paidCount = recurring.filter((r) => r.status === "paid").length;
  const overdueCount = recurring.filter((r) => r.status === "overdue").length;

  // KPI summary values — Alerts shows only TRUE alerts (not deadline reminders)
  const actionItemsCount = alerts.length;
  const criticalAlerts = alerts.filter((a: any) => isCritical(a)).length;
  const actionSubtitle =
    actionItemsCount === 0
      ? "All clear"
      : criticalAlerts > 0
        ? `${criticalAlerts} need${criticalAlerts === 1 ? "s" : ""} attention`
        : `${actionItemsCount} to review`;
  const nextAlert = alerts[0];

  const paymentsTitle = !paymentsSetup
    ? "Not set up"
    : overdueCount > 0
      ? `${overdueCount} missed`
      : "All clear";
  const paymentsSubtitle = !paymentsSetup
    ? "Set up rent collection"
    : `£${p.rent.toLocaleString()} / mo · ${paidCount} paid`;

  const pendingCount = pendingTasks.length;
  const tasksSubtitle = pendingCount === 0
    ? "Stage complete"
    : `In ${activePhase}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5">
      {/* KPI cards row — uniform light-blue gradient tone */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Alerts"
          value={String(actionItemsCount)}
          subtitle={actionSubtitle}
          detail={nextAlert ? nextAlert.text : undefined}
        />
        <KpiCard
          icon={<CreditCard className="w-4 h-4" />}
          label="Payments"
          value={paymentsTitle}
          subtitle={paymentsSubtitle}
          cta={!paymentsSetup ? "Set up" : undefined}
        />
        <KpiCard
          icon={<MessageSquare className="w-4 h-4" />}
          label="Pending Messages"
          value={String(pendingCount)}
          subtitle={tasksSubtitle}
        />
      </div>

      {/* 2:1 split — Left: tenant card + tenancy stage card stacked; Right: calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: two stacked cards */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Tenant card — name on left, image on right */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-card">
            <div className="grid grid-cols-1 md:grid-cols-5">
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
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No tenant assigned</p>
                )}
              </div>

              {heroPhoto && (
                <div className="md:col-span-2 relative h-40 md:h-auto bg-secondary order-first md:order-last">
                  <img src={heroPhoto.src} alt={p.address} className="absolute inset-0 w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Tenancy Stage card — separate */}
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

            {(() => {
              const idx = curPhaseIdx >= 0 ? curPhaseIdx : phaseProgress.length - 1;
              const current = phaseProgress[idx];
              const allComplete = curPhaseIdx < 0;
              return (
                <div>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                      allComplete ? "bg-success text-primary-foreground" : "bg-primary text-primary-foreground ring-4 ring-primary/15"
                    )}>
                      {allComplete ? <Check className="w-4 h-4" /> : <span className="text-sm font-bold">{idx + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{allComplete ? "Complete" : current.name}</p>
                      {!allComplete && current.total > 0 && (
                        <p className="text-[11px] text-muted-foreground">{current.done}/{current.total} tasks done</p>
                      )}
                    </div>
                  </div>

                  {!allComplete && pendingTasks.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border space-y-1.5">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Remaining in this stage</p>
                      {pendingTasks.slice(0, 4).map((t: any) => (
                        <div key={t.id} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <p className="text-xs text-foreground leading-snug line-clamp-2">{t.label}</p>
                        </div>
                      ))}
                      {pendingTasks.length > 4 && (
                        <p className="text-[10px] text-primary font-semibold pt-1">+{pendingTasks.length - 4} more</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right column: standalone Deadlines calendar */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <CalendarClock className="w-3.5 h-3.5 text-primary" />
              Deadlines
            </h3>
            <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {deadlineDates.length}
            </span>
          </div>
          {deadlineDates.length > 0 ? (
            <DeadlineCalendar dates={deadlineDates} />
          ) : (
            <p className="text-xs text-muted-foreground">No upcoming deadlines.</p>
          )}
        </div>
      </div>

    </motion.div>
  );
}

function KpiCard({
  icon, label, value, subtitle, detail, cta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  detail?: string;
  cta?: string;
}) {
  // Uniform light-blue gradient — calm, no alarming red
  return (
    <div className="relative rounded-xl border border-info/20 p-4 shadow-card overflow-hidden bg-gradient-to-br from-info-muted/70 via-card to-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-info-muted text-info">
          {icon}
        </div>
      </div>
      <p className="font-display text-2xl font-bold leading-tight text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>

      {detail && (
        <p className="text-[11px] text-foreground mt-2 pt-2 border-t border-border/60 truncate">{detail}</p>
      )}
      {cta && (
        <button className="text-[11px] font-semibold text-primary hover:underline mt-2 inline-flex items-center gap-1">
          {cta} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

