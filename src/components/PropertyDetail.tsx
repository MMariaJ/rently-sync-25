import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowLeft, Building2, CheckSquare, Lock, MessageSquare,
  CreditCard, Star, User, AlertTriangle, ChevronRight, ChevronDown, Check,
} from "lucide-react";
import { ComplianceDonut } from "./ComplianceDonut";
import { StarRating } from "./StarRating";
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
    <div className="space-y-5 pb-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to portfolio
      </button>

      {/* Property banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6 shadow-card"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-lg font-bold text-foreground tracking-tight">{p.address}</h2>
              {p.isHmo && (
                <span className="text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] border border-[#ddd6fe] rounded-full px-2 py-0.5">HMO</span>
              )}
            </div>
            {pr.rating > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <StarRating rating={pr.rating} size={12} />
                <span className="text-xs font-bold text-foreground">{pr.rating}</span>
                <span className="text-[10px] text-muted-foreground">({pr.count})</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <div className="flex items-center gap-3">
              <ComplianceDonut percentage={pct} />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Compliance</p>
                <p className={cn("text-sm font-bold", pct >= 80 ? "text-success" : pct >= 50 ? "text-warning" : "text-danger")}>
                  {getRAGLabel(pct)}
                </p>
              </div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-right">
              <p className="text-lg font-black text-foreground leading-none">£{p.rent.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">per month</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab navigation */}
      <div className="bg-card rounded-xl border border-border p-1 flex gap-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all",
              activeTab === tab.id
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
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

      {activeTab !== "overview" && (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} tab — coming in next iteration
          </p>
        </div>
      )}
    </div>
  );
}

function OverviewTab({
  property: p, pct, alerts, ti, contract, hmoTenants, completed, vault,
}: {
  property: Property;
  pct: number;
  alerts: any[];
  ti: any;
  contract: any;
  hmoTenants: any;
  completed: Record<string, boolean>;
  vault: VaultDoc[];
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const toggle = (key: string) => {
    setExpandedSections(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };
  const isOpen = (key: string) => expandedSections.has(key);

  // Lifecycle
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
    <div className="grid grid-cols-3 gap-5">
      {/* Left column — Tenant + Lifecycle */}
      <div className="col-span-2 space-y-5">
        {/* Tenant section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-5 shadow-card"
        >
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-foreground" />
            <h3 className="text-sm font-bold text-foreground">
              {hmoTenants ? `Tenants (${hmoTenants.length})` : "Tenant"}
            </h3>
          </div>

          {hmoTenants ? (
            <div className="space-y-2">
              {hmoTenants.map((ht: any) => (
                <div key={ht.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <img src={ht.avatarUrl} alt={ht.name} className="w-10 h-10 rounded-xl object-cover border border-border" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{ht.name}</span>
                      {ht.verified && <Check className="w-3.5 h-3.5 text-success" />}
                    </div>
                    <span className="text-xs text-muted-foreground">£{ht.rent}/mo · Since {ht.since}</span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <StarRating rating={ht.rating} size={10} />
                      <span className="text-[10px] font-bold text-foreground">{ht.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : ti ? (
            <div className="flex items-center gap-4">
              <img src={ti.avatarUrl} alt={ti.name} className="w-12 h-12 rounded-xl object-cover border border-border" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-foreground">{ti.name}</span>
                  {ti.verified && (
                    <span className="text-[9px] font-semibold text-success bg-success-muted px-1.5 py-0.5 rounded border border-success/20">Verified</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={ti.rating} size={11} />
                  <span className="text-xs font-bold text-foreground">{ti.rating}</span>
                  <span className="text-[10px] text-muted-foreground">({ti.reviewCount})</span>
                </div>
              </div>
              {contract && (
                <div className="text-right text-xs text-muted-foreground">
                  <p>Since {contract.start}</p>
                  <p>Ends {contract.end}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tenant assigned</p>
          )}
        </motion.div>

        {/* Tenancy lifecycle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl border border-border p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-foreground" />
              <h3 className="text-sm font-bold text-foreground">Tenancy Lifecycle</h3>
            </div>
            <button className="text-xs font-semibold text-landlord flex items-center gap-1 hover:underline">
              All tasks <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Phase indicator */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[hsl(var(--landlord)/0.06)] border border-landlord/10 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-landlord shrink-0" />
            <span className="text-sm font-semibold text-foreground flex-1">
              Currently in {curPhaseIdx >= 0 ? PHASES[curPhaseIdx] : PHASES[PHASES.length - 1]}
            </span>
            <span className={cn("text-xs font-semibold", pendingTasks.length > 0 ? "text-landlord" : "text-success")}>
              {pendingTasks.length > 0 ? `${pendingTasks.length} pending` : "On track"}
            </span>
          </div>

          {/* Pending tasks */}
          {pendingTasks.length === 0 ? (
            <div className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-lg bg-success-muted flex items-center justify-center">
                <Check className="w-4 h-4 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">All tasks complete for this phase</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {pendingTasks.slice(0, 5).map((t: any) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                >
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", t.type === "legal" ? "bg-danger" : "bg-info")} />
                  <span className="text-xs font-medium text-foreground flex-1 truncate">{t.label}</span>
                  <span className={cn(
                    "text-[9px] font-bold rounded px-1.5 py-0.5",
                    t.type === "legal" ? "text-danger bg-danger-muted" : "text-info bg-info-muted"
                  )}>
                    {t.type === "legal" ? "Legal" : "Rec."}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Right column — Summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl border border-border p-5 shadow-card"
      >
        <h3 className="text-sm font-bold text-foreground mb-3">Property Summary</h3>

        {/* Alerts accordion */}
        <SummarySection
          label="Alerts"
          icon={<AlertTriangle className={cn("w-3.5 h-3.5", alerts.length > 0 ? "text-danger" : "text-success")} />}
          value={alerts.length > 0 ? `${alerts.length} action${alerts.length > 1 ? "s" : ""} needed` : "All clear"}
          valueColor={alerts.length > 0 ? "text-danger" : "text-success"}
          badge={alerts.length > 0 ? alerts.length : undefined}
          isOpen={isOpen("alerts")}
          onToggle={() => toggle("alerts")}
        >
          {alerts.length === 0 ? (
            <p className="text-xs text-success font-medium">No actions required</p>
          ) : (
            <div className="space-y-1.5">
              {alerts.slice(0, 4).map((a, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors">
                  <AlertTriangle className={cn("w-3 h-3 shrink-0", a.severity === "high" ? "text-danger" : "text-warning")} />
                  <span className="text-[11px] font-medium text-foreground flex-1 truncate">{a.text}</span>
                </div>
              ))}
            </div>
          )}
        </SummarySection>

        {/* Messages */}
        <SummarySection
          label="Messages"
          icon={<MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />}
          value="No new messages"
          valueColor="text-muted-foreground"
          isOpen={isOpen("messages")}
          onToggle={() => toggle("messages")}
        >
          <p className="text-xs text-muted-foreground">No messages yet</p>
        </SummarySection>

        {/* Payments */}
        <SummarySection
          label="Payments"
          icon={<CreditCard className="w-3.5 h-3.5 text-muted-foreground" />}
          value={missedCount > 0 ? `${missedCount} missed` : recurring.length > 0 ? "On track" : "No payments"}
          valueColor={missedCount > 0 ? "text-danger" : "text-success"}
          badge={missedCount > 0 ? missedCount : undefined}
          isOpen={isOpen("payments")}
          onToggle={() => toggle("payments")}
        >
          {recurring.length === 0 ? (
            <p className="text-xs text-muted-foreground">No recurring payments set up</p>
          ) : (
            <div className="space-y-1.5">
              {recurring.slice(0, 4).map((rp) => (
                <div key={rp.id} className="flex items-center justify-between text-xs">
                  <span className="text-foreground font-medium">{rp.label}</span>
                  <span className={cn(
                    "font-semibold",
                    rp.status === "paid" ? "text-success" : rp.status === "overdue" ? "text-danger" : "text-warning"
                  )}>
                    {rp.status === "paid" ? "Paid" : rp.status === "overdue" ? "Overdue" : "Due soon"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SummarySection>

        {/* Upcoming */}
        <SummarySection
          label="Upcoming"
          icon={<CheckSquare className="w-3.5 h-3.5 text-muted-foreground" />}
          value="View deadlines"
          valueColor="text-muted-foreground"
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
              <p className="text-xs text-muted-foreground">No upcoming deadlines</p>
            ) : (
              <div className="space-y-1.5">
                {upcoming.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium truncate flex-1 mr-2">{item.label}</span>
                    <span className={cn(
                      "font-semibold shrink-0",
                      item.status === "expired" ? "text-danger" : item.days < 90 ? "text-warning" : "text-muted-foreground"
                    )}>
                      {item.status === "expired" ? "Expired" : `${item.days}d`}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </SummarySection>
      </motion.div>
    </div>
  );
}

function SummarySection({
  label, icon, value, valueColor, badge, isOpen, onToggle, children,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  valueColor: string;
  badge?: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 px-0.5"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-bold text-foreground">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="text-[9px] font-bold bg-danger-muted text-danger rounded-full px-1.5 py-0.5">{badge}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-[11px] font-semibold", valueColor)}>{value}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </div>
      </button>
      {isOpen && (
        <div className="pb-3 px-0.5">
          {children}
        </div>
      )}
    </div>
  );
}
