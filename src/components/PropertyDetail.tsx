import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowLeft, Building2, CheckSquare, Lock, MessageSquare,
  CreditCard, Star, User, AlertTriangle, ChevronRight, ChevronDown, Check,
  FileText, Clock,
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
      {/* Back + breadcrumb */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to portfolio
      </button>

      {/* Property header */}
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

      {/* Tabs */}
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

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab
          property={p}
          pct={pct}
          alerts={alerts}
          ti={ti}
          contract={contract}
          hmoTenants={hmoTenants}
          completed={completed}
          vault={vault}
        />
      )}

      {activeTab === "tasks" && (
        <TasksTab property={p} completed={completed} allVaults={allVaults} />
      )}

      {activeTab === "vault" && (
        <VaultTab property={p} allVaults={allVaults} />
      )}

      {activeTab === "comms" && (
        <CommsTab property={p} />
      )}

      {activeTab === "payments" && (
        <PaymentsTab property={p} />
      )}

      {activeTab === "reviews" && (
        <ReviewsTab property={p} />
      )}
    </div>
  );
}

function OverviewTab({
  property: p, pct, alerts, ti, contract, hmoTenants, completed, vault,
}: {
  property: Property; pct: number; alerts: any[]; ti: any; contract: any;
  hmoTenants: any; completed: Record<string, boolean>; vault: VaultDoc[];
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["alerts"]));
  const toggle = (key: string) => {
    setExpandedSections(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };
  const isOpen = (key: string) => expandedSections.has(key);

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-5 gap-5"
    >
      {/* Left — 3 cols */}
      <div className="col-span-3 space-y-5">
        {/* Tenant card */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
          <h3 className="font-display text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            {hmoTenants ? `Tenants (${hmoTenants.length})` : "Tenant"}
          </h3>

          {hmoTenants ? (
            <div className="space-y-2">
              {hmoTenants.map((ht: any) => (
                <div key={ht.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors">
                  <img src={ht.avatarUrl} alt={ht.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-border" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{ht.name}</span>
                      {ht.verified && (
                        <span className="text-[9px] font-semibold text-success bg-success-muted rounded px-1.5 py-0.5">Verified</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">£{ht.rent}/mo · Since {ht.since}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="w-3 h-3 text-warning" fill="currentColor" />
                    <span className="text-xs font-bold text-foreground">{ht.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : ti ? (
            <div className="flex items-center gap-4">
              <img src={ti.avatarUrl} alt={ti.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-border" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display text-sm font-bold text-foreground">{ti.name}</span>
                  {ti.verified && (
                    <span className="text-[9px] font-semibold text-success bg-success-muted rounded px-1.5 py-0.5">Verified</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={ti.rating} size={11} />
                  <span className="text-xs font-bold text-foreground">{ti.rating}</span>
                  <span className="text-[10px] text-muted-foreground">({ti.reviewCount})</span>
                </div>
              </div>
              {contract && (
                <div className="text-right text-xs text-muted-foreground space-y-0.5 shrink-0">
                  <p className="flex items-center gap-1 justify-end"><Clock className="w-3 h-3" /> Since {contract.start}</p>
                  <p>Ends {contract.end}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tenant assigned</p>
          )}
        </div>

        {/* Lifecycle */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              Tenancy Lifecycle
            </h3>
            <button className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline underline-offset-2">
              All tasks <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Phase indicator */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-landlord-light border border-primary/10 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="text-sm font-semibold text-foreground flex-1">
              {curPhaseIdx >= 0 ? PHASES[curPhaseIdx] : PHASES[PHASES.length - 1]}
            </span>
            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", 
              pendingTasks.length > 0 ? "text-primary bg-primary/10" : "text-success bg-success-muted"
            )}>
              {pendingTasks.length > 0 ? `${pendingTasks.length} pending` : "On track"}
            </span>
          </div>

          {/* Tasks */}
          {pendingTasks.length === 0 ? (
            <div className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-lg bg-success-muted flex items-center justify-center">
                <Check className="w-4 h-4 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">All tasks complete for this phase</p>
            </div>
          ) : (
            <div className="space-y-1">
              {pendingTasks.slice(0, 6).map((t: any) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer group"
                >
                  <div className={cn("w-2 h-2 rounded-full shrink-0", t.type === "legal" ? "bg-danger" : "bg-info")} />
                  <span className="text-xs font-medium text-foreground flex-1 truncate">{t.label}</span>
                  <span className={cn(
                    "text-[10px] font-semibold rounded-full px-2 py-0.5",
                    t.type === "legal" ? "text-danger bg-danger-muted" : "text-info bg-info-muted"
                  )}>
                    {t.type === "legal" ? "Legal" : "Suggested"}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar — 2 cols */}
      <div className="col-span-2 space-y-5">
        {/* Alerts */}
        <SummaryAccordion
          label="Alerts"
          icon={<AlertTriangle className={cn("w-4 h-4", alerts.length > 0 ? "text-danger" : "text-success")} />}
          count={alerts.length}
          countColor={alerts.length > 0 ? "bg-danger text-primary-foreground" : "bg-success text-success-foreground"}
          status={alerts.length > 0 ? `${alerts.length} action${alerts.length > 1 ? "s" : ""} needed` : "All clear"}
          statusColor={alerts.length > 0 ? "text-danger" : "text-success"}
          isOpen={isOpen("alerts")}
          onToggle={() => toggle("alerts")}
        >
          {alerts.length === 0 ? (
            <p className="text-xs text-success font-medium px-1">No actions required 🎉</p>
          ) : (
            <div className="space-y-1.5">
              {alerts.slice(0, 4).map((a, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors cursor-pointer">
                  <AlertTriangle className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", a.severity === "high" ? "text-danger" : "text-warning")} />
                  <span className="text-xs font-medium text-foreground leading-relaxed">{a.text}</span>
                </div>
              ))}
            </div>
          )}
        </SummaryAccordion>

        {/* Messages */}
        <SummaryAccordion
          label="Messages"
          icon={<MessageSquare className="w-4 h-4 text-muted-foreground" />}
          status="No new messages"
          statusColor="text-muted-foreground"
          isOpen={isOpen("messages")}
          onToggle={() => toggle("messages")}
        >
          <p className="text-xs text-muted-foreground px-1">No messages yet</p>
        </SummaryAccordion>

        {/* Payments */}
        <SummaryAccordion
          label="Payments"
          icon={<CreditCard className="w-4 h-4 text-muted-foreground" />}
          count={missedCount > 0 ? missedCount : undefined}
          countColor="bg-danger text-primary-foreground"
          status={missedCount > 0 ? `${missedCount} missed` : recurring.length > 0 ? "On track" : "No payments"}
          statusColor={missedCount > 0 ? "text-danger" : "text-success"}
          isOpen={isOpen("payments")}
          onToggle={() => toggle("payments")}
        >
          {recurring.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1">No recurring payments set up</p>
          ) : (
            <div className="space-y-2">
              {recurring.slice(0, 4).map((rp) => (
                <div key={rp.id} className="flex items-center justify-between text-xs px-1">
                  <span className="text-foreground font-medium">{rp.label}</span>
                  <span className={cn(
                    "font-semibold px-2 py-0.5 rounded-full text-[10px]",
                    rp.status === "paid" ? "text-success bg-success-muted" :
                    rp.status === "overdue" ? "text-danger bg-danger-muted" :
                    "text-warning bg-warning-muted"
                  )}>
                    {rp.status === "paid" ? "Paid" : rp.status === "overdue" ? "Overdue" : "Due soon"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SummaryAccordion>

        {/* Upcoming */}
        <SummaryAccordion
          label="Upcoming Deadlines"
          icon={<Clock className="w-4 h-4 text-muted-foreground" />}
          status="View"
          statusColor="text-muted-foreground"
          isOpen={isOpen("upcoming")}
          onToggle={() => toggle("upcoming")}
        >
          {(() => {
            const docValidity = DOC_VALIDITY_BY_PROP[p.id] || {};
            const upcoming = Object.entries(docValidity)
              .filter(([, v]) => v.status !== "valid" || v.days < 180)
              .map(([name, v]) => ({ label: name, days: v.days, status: v.status }))
              .sort((a, b) => a.days - b.days);

            return upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground px-1">No upcoming deadlines</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs px-1">
                    <span className="text-foreground font-medium truncate flex-1 mr-2">{item.label}</span>
                    <span className={cn(
                      "font-semibold shrink-0 px-2 py-0.5 rounded-full text-[10px]",
                      item.status === "expired" ? "text-danger bg-danger-muted" :
                      item.days < 90 ? "text-warning bg-warning-muted" :
                      "text-muted-foreground bg-secondary"
                    )}>
                      {item.status === "expired" ? "Expired" : `${item.days}d`}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </SummaryAccordion>
      </div>
    </motion.div>
  );
}

function SummaryAccordion({
  label, icon, count, countColor, status, statusColor, isOpen, onToggle, children,
}: {
  label: string; icon: React.ReactNode; count?: number; countColor?: string;
  status: string; statusColor: string; isOpen: boolean; onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-sm font-semibold text-foreground">{label}</span>
          {count !== undefined && count > 0 && (
            <span className={cn("text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1", countColor)}>
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-medium", statusColor)}>{status}</span>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-0">
          {children}
        </div>
      )}
    </div>
  );
}
