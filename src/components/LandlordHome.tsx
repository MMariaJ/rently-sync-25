import { cn } from "@/lib/utils";
import { Building2, User, ArrowRight, Star, AlertTriangle, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { StarRating } from "./StarRating";
import { ComplianceDonut } from "./ComplianceDonut";
import {
  PORTFOLIO, TENANT_INFO, HMO_TENANTS, PROP_PHOTOS,
  PROP_RATINGS, PAYMENTS_BY_PROP, LANDLORD_PROFILE,
  VAULT_INIT, TASK_DATA, PHASES,
  type Property, type VaultDoc,
} from "@/data/constants";
import { getPropertyAlerts, getComplianceForProperty, getRAGColor, getRAGLabel } from "@/data/helpers";

interface LandlordHomeProps {
  portfolio: Property[];
  completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>;
  onSelectProperty: (id: string) => void;
  onAddProperty: () => void;
}

export function LandlordHome({ portfolio, completed, allVaults, onSelectProperty, onAddProperty }: LandlordHomeProps) {
  const monthlyIncome = portfolio.reduce((s, p) => s + p.rent, 0);
  const avgCompliance = Math.round(
    portfolio.reduce((s, p) => s + getComplianceForProperty(p.id, "landlord", completed, allVaults, !!p.isHmo), 0) / Math.max(portfolio.length, 1)
  );
  const totalAlerts = portfolio.reduce((s, p) => s + getPropertyAlerts(p.id, allVaults[p.id] || VAULT_INIT).length, 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-card rounded-2xl border border-border p-6 shadow-card"
      >
        <div className="flex items-center gap-5">
          <img
            src={LANDLORD_PROFILE.avatarUrl}
            alt={LANDLORD_PROFILE.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-border"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground tracking-tight">{LANDLORD_PROFILE.name}</h2>
              {LANDLORD_PROFILE.verified && (
                <span className="text-[10px] font-semibold text-success bg-success-muted px-2 py-0.5 rounded-md border border-success/20">
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <StarRating rating={LANDLORD_PROFILE.rating} size={12} />
              <span className="font-bold text-foreground">{LANDLORD_PROFILE.rating}</span>
              <span className="text-muted-foreground text-xs">({LANDLORD_PROFILE.reviewCount} reviews)</span>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="text-muted-foreground text-xs">{portfolio.length} properties</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right">
              <p className="text-xl font-black text-foreground tracking-tight leading-none">
                £{monthlyIncome.toLocaleString()}
              </p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mt-1">
                Monthly Rent
              </p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex items-center gap-3">
              <ComplianceDonut percentage={avgCompliance} />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Compliance</p>
                <p className={cn("text-sm font-bold", avgCompliance >= 80 ? "text-success" : avgCompliance >= 50 ? "text-warning" : "text-danger")}>
                  {getRAGLabel(avgCompliance)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-foreground" />
          <h3 className="text-base font-bold text-foreground">Properties</h3>
          <span className="text-xs bg-secondary text-muted-foreground rounded-md px-2 py-0.5 font-semibold">
            {portfolio.length}
          </span>
        </div>
        {totalAlerts > 0 && (
          <div className="flex items-center gap-1.5 text-danger text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            {totalAlerts} alert{totalAlerts > 1 ? "s" : ""} across properties
          </div>
        )}
      </div>

      {/* Property cards */}
      <div className="grid grid-cols-1 gap-3">
        {portfolio.map((p, i) => (
          <PropertyCard
            key={p.id}
            property={p}
            completed={completed}
            allVaults={allVaults}
            onSelect={() => onSelectProperty(p.id)}
            index={i}
          />
        ))}
      </div>

      {/* Add property */}
      <button
        onClick={onAddProperty}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-border hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Add a property
      </button>
    </div>
  );
}

function PropertyCard({
  property: p,
  completed,
  allVaults,
  onSelect,
  index,
}: {
  property: Property;
  completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>;
  onSelect: () => void;
  index: number;
}) {
  const pct = getComplianceForProperty(p.id, "landlord", completed, allVaults, !!p.isHmo);
  const alerts = getPropertyAlerts(p.id, allVaults[p.id] || VAULT_INIT);
  const hasHigh = alerts.some(a => a.severity === "high");
  const ti = TENANT_INFO[p.id];
  const photo = (PROP_PHOTOS[p.id] || [])[0];
  const payments = PAYMENTS_BY_PROP[p.id] || [];
  const missedCount = payments.filter(pm => pm.status === "missed").length;
  const pr = PROP_RATINGS[p.id] || { rating: 0, count: 0 };
  const hmoTenants = p.isHmo ? HMO_TENANTS[p.id] : null;

  // Current phase
  const vault = allVaults[p.id] || VAULT_INIT;
  const isDocUp = (n: string) => vault.some(d => d.name === n && d.status === "uploaded");
  const isDone = (t: any) => completed[`${p.id}_${t.id}`] || (t.vaultDoc && isDocUp(t.vaultDoc));
  const curPhaseIdx = PHASES.findIndex(ph => {
    const tasks = (TASK_DATA["landlord"][ph] || []).filter((t: any) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || p.isHmo));
    return tasks.length > 0 && tasks.some((t: any) => !isDone(t));
  });
  const curPhaseName = curPhaseIdx >= 0 ? PHASES[curPhaseIdx] : PHASES[PHASES.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onSelect}
      className="bg-card rounded-2xl border border-border overflow-hidden cursor-pointer transition-shadow hover:shadow-card-hover group"
    >
      <div className="flex h-[148px]">
        {/* Property image */}
        <div className="w-36 shrink-0 overflow-hidden relative">
          {photo ? (
            <img src={photo.src} alt={photo.label} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <Building2 className="w-7 h-7 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            {/* Address + rating */}
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-bold text-foreground truncate leading-tight">
                {p.address.split(",")[0]}
              </h4>
              {pr.rating > 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="w-3 h-3 text-warning" fill="currentColor" />
                  <span className="text-xs font-bold text-foreground">{pr.rating}</span>
                </div>
              )}
            </div>

            {/* Tenant */}
            <div className="flex items-center gap-2 mb-3">
              {hmoTenants ? (
                <>
                  <div className="flex -space-x-1.5">
                    {hmoTenants.slice(0, 3).map((ht) => (
                      <img key={ht.id} src={ht.avatarUrl} alt={ht.name} className="w-5 h-5 rounded-full object-cover border-2 border-card" />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{hmoTenants.length} tenants</span>
                  <span className="text-[9px] font-bold text-[#7c3aed] bg-[#f5f3ff] border border-[#ddd6fe] rounded-full px-2 py-0.5">HMO</span>
                </>
              ) : (
                <>
                  {ti ? (
                    <img src={ti.avatarUrl} alt={ti.name} className="w-5 h-5 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground font-medium">{ti ? ti.name : "Vacant"}</span>
                </>
              )}
            </div>

            {/* Status chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {p.status === "active" && (
                <span className="text-[10px] font-semibold text-success bg-success-muted border border-success/20 rounded-full px-2 py-0.5">Active</span>
              )}
              {missedCount > 0 && (
                <span className="text-[10px] font-semibold text-danger bg-danger-muted border border-danger/20 rounded-full px-2 py-0.5">
                  {missedCount} missed
                </span>
              )}
              {hasHigh && (
                <span className="text-[10px] font-semibold text-danger bg-danger-muted border border-danger/20 rounded-full px-2 py-0.5">
                  Action required
                </span>
              )}
            </div>
          </div>

          {/* Compliance bar */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
              {p.status === "vacant" ? "Not started" : curPhaseName}
            </span>
            <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: getRAGColor(pct) }}
              />
            </div>
            <span className="text-[10px] font-bold shrink-0" style={{ color: getRAGColor(pct) }}>
              {p.status === "vacant" ? "—" : `${pct}%`}
            </span>
          </div>
        </div>

        {/* Right: Rent + CTA */}
        <div className="w-24 shrink-0 p-4 flex flex-col items-end justify-between">
          <div className="text-right">
            {p.rent > 0 ? (
              <>
                <p className="text-base font-black text-foreground leading-none">£{p.rent.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground font-medium mt-0.5">/month</p>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-landlord text-landlord-foreground text-[11px] font-semibold hover:brightness-110 transition-all"
          >
            View <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
