import { cn } from "@/lib/utils";
import { Building2, User, Star, Plus } from "lucide-react";
import {
  TENANT_INFO, HMO_TENANTS, PROP_PHOTOS,
  PROP_RATINGS, PAYMENTS_BY_PROP,
  VAULT_INIT, TASK_DATA, PHASES, TENANCY_INFO,
  type Property, type VaultDoc,
} from "@/data/constants";
import { getPropertyAlerts, getComplianceForProperty } from "@/data/helpers";

interface LandlordHomeProps {
  portfolio: Property[];
  completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>;
  onSelectProperty: (id: string) => void;
  onAddProperty: () => void;
}

export function LandlordHome({ portfolio, completed, allVaults, onSelectProperty, onAddProperty }: LandlordHomeProps) {
  const totalIncome = portfolio.reduce((s, p) => s + p.rent, 0);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] text-foreground tracking-tight font-medium" style={{ letterSpacing: "-0.02em" }}>
            Your properties
          </h1>
          <p className="text-[14px] text-muted-foreground mt-1.5">
            {portfolio.length} properties · £{totalIncome.toLocaleString()}/month total income
          </p>
        </div>
        <button
          onClick={onAddProperty}
          className="flex items-center gap-1.5 h-10 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add property
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolio.map((p) => (
          <PropertyCard
            key={p.id}
            property={p}
            completed={completed}
            allVaults={allVaults}
            onSelect={() => onSelectProperty(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PropertyCard({
  property: p, completed, allVaults, onSelect,
}: {
  property: Property; completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>; onSelect: () => void;
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
  // The stage label reflects where the tenancy actually is (declared on
  // TENANCY_INFO), not the first phase that happens to have an outstanding
  // task — leftover Pre-Move-In items don't mean a mid-tenancy let is still
  // pre-move-in. Fall back to the task-walk heuristic for properties with
  // no declared phase (e.g. vacant units).
  const declaredPhase = TENANCY_INFO[p.id]?.currentPhase;
  const curPhaseIdx = PHASES.findIndex(ph => {
    const tasks = (TASK_DATA["landlord"][ph] || []).filter((t: any) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || p.isHmo));
    return tasks.length > 0 && tasks.some((t: any) => !isDone(t));
  });
  const curPhaseName = declaredPhase ?? (curPhaseIdx >= 0 ? PHASES[curPhaseIdx] : PHASES[PHASES.length - 1]);

  return (
    <button
      onClick={onSelect}
      className="photo-card bg-card text-left overflow-hidden block w-full"
      style={{ borderRadius: "20px", border: "0.5px solid hsl(var(--border))" }}
    >
      <div className="relative overflow-hidden bg-secondary" style={{ aspectRatio: "16 / 11" }}>
        {photo ? (
          <img
            src={photo.src}
            alt={photo.label}
            loading="lazy"
            className="photo-zoom w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-7 h-7 text-muted-foreground/40" />
          </div>
        )}
        {(p.isHmo || hasHigh) && (
          <div className="absolute top-3 left-3 flex gap-1.5">
            {p.isHmo && (
              <span
                className="text-[11px] font-medium text-foreground rounded-full px-2.5 py-1"
                style={{ backgroundColor: "rgba(255,255,255,0.95)", boxShadow: "var(--shadow-soft)" }}
              >
                HMO
              </span>
            )}
            {hasHigh && (
              <span
                className="text-[11px] font-medium rounded-full px-2.5 py-1"
                style={{ backgroundColor: "hsl(var(--danger))", color: "#fff", boxShadow: "var(--shadow-soft)" }}
              >
                Action needed
              </span>
            )}
          </div>
        )}
        {pr.rating > 0 && (
          <div
            className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1"
            style={{ backgroundColor: "rgba(255,255,255,0.95)", boxShadow: "var(--shadow-soft)" }}
          >
            <Star className="w-3 h-3" style={{ color: "#0F6E56", fill: "#0F6E56" }} />
            <span className="text-[12px] font-medium text-foreground tabular-nums">{pr.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] text-foreground font-medium truncate" style={{ letterSpacing: "-0.01em" }}>
              {p.address.split(",")[0]}
            </p>
            <p className="text-[13px] text-muted-foreground truncate mt-0.5">
              {p.address.split(",").slice(1).join(",").trim()}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[15px] text-foreground font-medium tabular-nums" style={{ letterSpacing: "-0.01em" }}>
              £{p.rent.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">/month</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hmoTenants ? (
            <>
              <div className="flex -space-x-2">
                {hmoTenants.slice(0, 3).map((ht) => (
                  <img
                    key={ht.id}
                    src={ht.avatarUrl}
                    alt={ht.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-card"
                  />
                ))}
              </div>
              <span className="text-[12px] text-muted-foreground">{hmoTenants.length} tenants</span>
            </>
          ) : ti ? (
            <>
              <img src={ti.avatarUrl} alt={ti.name} className="w-7 h-7 rounded-full object-cover" />
              <span className="text-[12px] text-muted-foreground truncate">{ti.name}</span>
            </>
          ) : (
            <>
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <span className="text-[12px] text-muted-foreground">Vacant</span>
            </>
          )}
        </div>

        {missedCount > 0 && (
          <p className="text-[12px] text-danger">
            {missedCount} missed payment{missedCount > 1 ? "s" : ""}
          </p>
        )}

        <div className="pt-3.5 hairline-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-muted-foreground">{curPhaseName}</span>
            <span className={cn("text-[12px] tabular-nums font-medium", pct < 50 ? "text-danger" : "text-foreground")}>
              {pct}%
            </span>
          </div>
          <div className="h-[4px] bg-secondary rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", pct < 50 ? "bg-danger" : "bg-primary")}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}
