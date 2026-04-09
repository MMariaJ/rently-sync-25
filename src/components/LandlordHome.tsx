import { cn } from "@/lib/utils";
import {
  Building2, User, Star, AlertTriangle, Plus,
  MapPin, ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { StarRating } from "./StarRating";
import { ComplianceDonut } from "./ComplianceDonut";
import {
  TENANT_INFO, HMO_TENANTS, PROP_PHOTOS,
  PROP_RATINGS, PAYMENTS_BY_PROP,
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Your Properties</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {portfolio.length} properties · {portfolio.reduce((s, p) => s + p.rent, 0).toLocaleString("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 })}/month total income
          </p>
        </div>
        <button
          onClick={onAddProperty}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add property
        </button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  );
}


function PropertyCard({
  property: p, completed, allVaults, onSelect, index,
}: {
  property: Property; completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>; onSelect: () => void; index: number;
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      onClick={onSelect}
      className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer transition-all hover:shadow-card-hover hover:-translate-y-0.5 group"
    >
      {/* Image */}
      <div className="h-36 overflow-hidden relative">
        {photo ? (
          <img src={photo.src} alt={photo.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <Building2 className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {p.status === "active" && (
            <span className="text-[10px] font-semibold bg-success/90 text-success-foreground backdrop-blur-sm rounded-full px-2 py-0.5">
              Active
            </span>
          )}
          {p.isHmo && (
            <span className="text-[10px] font-bold bg-primary/90 text-primary-foreground backdrop-blur-sm rounded-full px-2 py-0.5">
              HMO
            </span>
          )}
        </div>
        {hasHigh && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 text-[10px] font-semibold bg-danger/90 text-primary-foreground backdrop-blur-sm rounded-full px-2 py-0.5">
              <AlertTriangle className="w-3 h-3" /> Action needed
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Address + rent */}
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h4 className="font-display text-sm font-bold text-foreground truncate">
              {p.address.split(",")[0]}
            </h4>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">
                {p.address.split(",").slice(1).join(",").trim()}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="font-display text-base font-bold text-foreground">£{p.rent.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">/month</p>
          </div>
        </div>

        {/* Tenant row */}
        <div className="flex items-center gap-2">
          {hmoTenants ? (
            <>
              <div className="flex -space-x-1.5">
                {hmoTenants.slice(0, 3).map((ht) => (
                  <img key={ht.id} src={ht.avatarUrl} alt={ht.name} className="w-6 h-6 rounded-full object-cover ring-2 ring-card" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{hmoTenants.length} tenants</span>
            </>
          ) : ti ? (
            <>
              <img src={ti.avatarUrl} alt={ti.name} className="w-6 h-6 rounded-full object-cover ring-1 ring-border" />
              <span className="text-xs text-muted-foreground">{ti.name}</span>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-3 h-3 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Vacant</span>
            </>
          )}
          {pr.rating > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              <Star className="w-3 h-3 text-warning" fill="currentColor" />
              <span className="text-xs font-semibold text-foreground">{pr.rating}</span>
            </div>
          )}
        </div>

        {/* Status chips */}
        {missedCount > 0 && (
          <span className="inline-flex text-[10px] font-semibold text-danger bg-danger-muted rounded-full px-2 py-0.5">
            {missedCount} missed payment{missedCount > 1 ? "s" : ""}
          </span>
        )}

        {/* Compliance bar */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {curPhaseName}
            </span>
            <span className="text-[11px] font-bold" style={{ color: getRAGColor(pct) }}>
              {pct}%
            </span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: getRAGColor(pct) }}
            />
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground text-xs font-semibold transition-all"
        >
          View details <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
