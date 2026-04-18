import { cn } from "@/lib/utils";
import { useState } from "react";
import { ArrowLeft, ChevronRight, Check } from "lucide-react";
import { ComplianceDonut } from "./ComplianceDonut";
import { DeadlineCalendar } from "./DeadlineCalendar";
import { StarRating } from "./StarRating";
import { TasksTab } from "./TasksTab";
import { LifecycleVaultTab as VaultTab } from "./LifecycleVaultTab";
import { CommsTab } from "./CommsTab";
import { PaymentsTab } from "./PaymentsTab";
import { ReviewsTab } from "./ReviewsTab";
import {
  TENANT_INFO, HMO_TENANTS, PROP_RATINGS, PROP_CONTRACT,
  RECURRING_PAYMENTS, DOC_VALIDITY_BY_PROP,
  VAULT_INIT, TASK_DATA, PHASES, PROP_PHOTOS,
  type Property, type VaultDoc,
} from "@/data/constants";
import { getPropertyAlerts, getComplianceForProperty } from "@/data/helpers";

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

  const tabs: { id: PropertyTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "tasks", label: "Tasks" },
    { id: "vault", label: "Vault" },
    { id: "comms", label: "Comms" },
    { id: "payments", label: "Payments" },
    { id: "reviews", label: "Reviews" },
  ];

  return (
    <div className="space-y-6 pb-12">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to portfolio
      </button>

      {/* Header — flat, no card */}
      <div className="flex items-end justify-between gap-6 pb-6 hairline-b">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[22px] tracking-tight text-foreground font-medium">{p.address}</h1>
            {p.isHmo && (
              <span className="text-[11px] font-medium text-foreground bg-secondary rounded-lg px-2 py-0.5">HMO</span>
            )}
          </div>
          {pr.rating > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <StarRating rating={pr.rating} size={12} />
              <span className="text-[12px] text-foreground tabular-nums">{pr.rating}</span>
              <span className="text-[12px] text-muted-foreground">· {pr.count} reviews</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-8 shrink-0">
          <div className="flex items-center gap-2.5">
            <ComplianceDonut percentage={pct} size={40} strokeWidth={3} showLabel={false} />
            <div>
              <p className="label-eyebrow">Compliance</p>
              <p className={cn("text-[15px] tabular-nums font-medium mt-0.5", pct < 50 ? "text-danger" : "text-foreground")}>
                {pct}%
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="label-eyebrow">Rent</p>
            <p className="text-[15px] tabular-nums font-medium text-foreground mt-0.5">£{p.rent.toLocaleString()}<span className="text-muted-foreground text-[12px]"> /mo</span></p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 hairline-b -mt-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-2.5 text-[13px] transition-colors -mb-px relative",
              activeTab === tab.id
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute left-3 right-3 -bottom-px h-px bg-foreground" />
            )}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <OverviewTab property={p} alerts={alerts} ti={ti} contract={contract} hmoTenants={hmoTenants} completed={completed} vault={vault} />
      )}
      {activeTab === "tasks" && <TasksTab property={p} completed={completed} allVaults={allVaults} />}
      {activeTab === "vault" && <VaultTab property={p} allVaults={allVaults} />}
      {activeTab === "comms" && <CommsTab property={p} />}
      {activeTab === "payments" && <PaymentsTab property={p} />}
      {activeTab === "reviews" && <ReviewsTab property={p} />}
    </div>
  );
}

function OverviewTab({
  property: p, alerts, ti, hmoTenants, completed, vault,
}: {
  property: Property; alerts: any[]; ti: any; contract: any;
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
  const phaseTasks = (TASK_DATA["landlord"][PHASES[Math.max(curPhaseIdx, 0)]] || [])
    .filter((t: any) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || p.isHmo));
  const doneInPhase = phaseTasks.filter(isDone).length;

  const docValidity = DOC_VALIDITY_BY_PROP[p.id] || {};
  const deadlines = Object.entries(docValidity)
    .filter(([, v]) => v.status === "expired" || (v.days > 0 && v.days <= 365))
    .map(([name, v]) => ({ label: name, ...v }))
    .sort((a, b) => a.days - b.days);

  const deadlineDates = deadlines
    .map((d) => {
      const dt = new Date(d.expiry);
      return isNaN(dt.getTime()) ? null : { date: dt, label: d.label, status: d.status, days: d.days };
    })
    .filter(Boolean) as { date: Date; label: string; status: string; days: number }[];

  const heroPhoto = (PROP_PHOTOS[p.id] && PROP_PHOTOS[p.id][0]) || null;

  const paymentsSetup = recurring.length > 0;
  const paidCount = recurring.filter((r) => r.status === "paid").length;
  const overdueCount = recurring.filter((r) => r.status === "overdue").length;

  const alertCount = alerts.length;
  const paymentsLine = !paymentsSetup
    ? "Not set up"
    : overdueCount > 0
      ? `${overdueCount} missed`
      : "All clear";
  const paymentsSub = !paymentsSetup
    ? "Set up rent collection"
    : `£${p.rent.toLocaleString()} / mo · ${paidCount} paid`;
  const allComplete = curPhaseIdx < 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Three flat stats — hairline divided, no cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 hairline rounded-xl">
        <SimpleStat
          label="Alerts"
          value={String(alertCount)}
          sub={alertCount === 0 ? "All clear" : alertCount === 1 ? "Needs attention" : `${alertCount} need attention`}
          tone={alertCount > 0 ? "danger" : "default"}
        />
        <SimpleStat
          label="Payments"
          value={paymentsLine}
          sub={paymentsSub}
          tone={overdueCount > 0 ? "danger" : "default"}
          divider
        />
        <SimpleStat
          label="Pending tasks"
          value={String(pendingTasks.length)}
          sub={`In ${activePhase}`}
          divider
        />
      </div>

      {/* Two-thirds : one-third split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — tenant + tenancy stage */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Tenant */}
          <section className="bg-card hairline rounded-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-5">
              <div className={cn("p-5", heroPhoto ? "md:col-span-3" : "md:col-span-5")}>
                <p className="label-eyebrow mb-4">{hmoTenants ? `Tenants (${hmoTenants.length})` : "Tenant"}</p>

                {hmoTenants ? (
                  <div className="space-y-3">
                    {hmoTenants.map((ht: any) => (
                      <div key={ht.id} className="flex items-center gap-3">
                        <img src={ht.avatarUrl} alt={ht.name} className="w-9 h-9 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-foreground truncate font-medium">{ht.name}</p>
                          <p className="text-[12px] text-muted-foreground">Since {ht.since}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 text-[12px] text-muted-foreground tabular-nums">
                          <StarRating rating={ht.rating} size={11} />
                          {ht.rating}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : ti ? (
                  <div className="flex items-start gap-4">
                    <img
                      src={ti.avatarUrl}
                      alt={ti.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[16px] text-foreground font-medium">{ti.name}</span>
                        {ti.verified && (
                          <span className="text-[11px] text-foreground bg-secondary rounded-lg px-1.5 py-0.5 inline-flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <StarRating rating={ti.rating} size={11} />
                        <span className="text-[12px] text-foreground tabular-nums">{ti.rating}</span>
                        <span className="text-[12px] text-muted-foreground">· tenant since {ti.since}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-muted-foreground">No tenant assigned.</p>
                )}
              </div>

              {heroPhoto && (
                <div className="md:col-span-2 relative h-40 md:h-auto bg-secondary">
                  <img src={heroPhoto.src} alt={p.address} className="absolute inset-0 w-full h-full object-cover" />
                </div>
              )}
            </div>
          </section>

          {/* Tenancy stage */}
          <section className="bg-card hairline rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="label-eyebrow">Tenancy stage</p>
              <span className="text-[12px] text-muted-foreground">{activePhase}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[13px] tabular-nums",
                allComplete ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground font-medium"
              )}>
                {allComplete ? <Check className="w-4 h-4" /> : (curPhaseIdx + 1)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] text-foreground font-medium truncate">{allComplete ? "Complete" : activePhase}</p>
                {!allComplete && phaseTasks.length > 0 && (
                  <p className="text-[12px] text-muted-foreground tabular-nums">{doneInPhase}/{phaseTasks.length} tasks done</p>
                )}
              </div>
            </div>

            {!allComplete && pendingTasks.length > 0 && (
              <div className="mt-5 pt-4 hairline-t space-y-2">
                <p className="label-eyebrow">Remaining in this stage</p>
                {pendingTasks.slice(0, 4).map((t: any) => (
                  <div key={t.id} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-muted-foreground mt-2 shrink-0" />
                    <p className="text-[13px] text-foreground leading-snug">{t.label}</p>
                  </div>
                ))}
                {pendingTasks.length > 4 && (
                  <p className="text-[12px] text-primary pt-1">+{pendingTasks.length - 4} more</p>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Right — calendar */}
        <section className="bg-card hairline rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="label-eyebrow">Deadlines</p>
            <span className="text-[12px] text-muted-foreground tabular-nums">{deadlineDates.length}</span>
          </div>
          {deadlineDates.length > 0 ? (
            <DeadlineCalendar dates={deadlineDates} />
          ) : (
            <p className="text-[13px] text-muted-foreground">No upcoming deadlines.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function SimpleStat({ label, value, sub, tone = "default", divider = false }: {
  label: string; value: string; sub: string; tone?: "default" | "danger"; divider?: boolean;
}) {
  return (
    <div className={cn("p-5 bg-card", divider && "md:hairline-l hairline-t md:border-t-0")}>
      <p className="label-eyebrow mb-2">{label}</p>
      <p className={cn(
        "text-[20px] tracking-tight tabular-nums font-medium",
        tone === "danger" ? "text-danger" : "text-foreground"
      )}>
        {value}
      </p>
      <p className="text-[12px] text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}
