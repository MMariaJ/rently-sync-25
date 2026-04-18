// Tenant home / dashboard.
//
// One property only (single-let tenant). Lays out a high-level summary and
// quick links into the property — same density and visual rhythm as the
// landlord Dashboard but tenant-flavoured: rent status, deposit, open tasks,
// landlord card.

import {
  type Property, TENANT_INFO, LANDLORD_PROFILE,
} from "@/data/constants";
import { getTenantPhase, getTenantPhaseProgress, buildTenantHero } from "@/state/tenantEngine";
import type { VaultDoc } from "@/data/constants";

const PURPLE = "#534AB7";
const GREEN = "#3B6D11";
const RED_BG = "#FBECEC";
const RED_DARK = "#791F1F";
const RED_MID = "#A32D2D";

interface TenantHomeProps {
  property: Property;
  completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>;
  onOpenProperty: () => void;
}

export function TenantHome({
  property, completed, allVaults, onOpenProperty,
}: TenantHomeProps) {
  const tenant = TENANT_INFO[property.id];
  const phase = getTenantPhase(property, completed, allVaults);
  const progress = getTenantPhaseProgress(property, completed, allVaults);
  const hero = buildTenantHero(property, completed, allVaults);

  const totalOpen =
    progress["Pre-Move-In"].open + progress["Move-In"].open +
    progress["During Tenancy"].open + progress["Move-Out"].open;

  const danger = property.paymentStatus === "late";
  const bg = danger ? RED_BG : "#F2F4F0";
  const headColor = danger ? RED_DARK : "#1F5A3A";
  const subColor = danger ? RED_MID : "#3A7355";
  const btnBg = danger ? RED_DARK : "#1F5A3A";

  return (
    <div className="space-y-6 pb-12">
      {/* Greeting */}
      <div>
        <p className="text-[12px] text-muted-foreground" style={{ letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 500 }}>
          {phase === "Pre-Move-In" ? "Pre-move-in" : phase === "Move-In" ? "Move-in" : "Active tenancy"}
        </p>
        <h1 className="text-[24px] font-medium text-foreground tracking-tight mt-1">
          Hi {tenant?.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {totalOpen === 0
            ? "Everything is up to date."
            : `${totalOpen} ${totalOpen === 1 ? "task needs" : "tasks need"} your attention.`}
        </p>
      </div>

      {/* Hero — what to do next */}
      <div
        className="rounded-xl flex items-center justify-between gap-4"
        style={{ backgroundColor: bg, padding: "1rem 1.25rem" }}
      >
        <div className="min-w-0">
          <p className="text-[15px] font-medium" style={{ color: headColor }}>
            {hero.headline}
          </p>
          <p className="text-[13px] mt-1" style={{ color: subColor }}>
            {hero.subline}
          </p>
        </div>
        <button
          onClick={onOpenProperty}
          className="shrink-0 text-[13px] font-medium text-white"
          style={{ backgroundColor: btnBg, borderRadius: "8px", padding: "8px 16px" }}
        >
          {hero.cta}
        </button>
      </div>

      {/* Three summary stats */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <Stat
          label="Next rent"
          value={`£${property.rent.toLocaleString()}`}
          sub={
            property.paymentStatus === "paid"
              ? `Paid ${property.paidDate ?? ""}`
              : property.paymentStatus === "late"
                ? `${property.daysLate ?? 1} days late`
                : `Due ${property.dueDate ?? "—"}`
          }
          tone={
            property.paymentStatus === "late" ? "danger" :
            property.paymentStatus === "paid" ? "good" : "neutral"
          }
        />
        <Stat
          label="Deposit"
          value={property.depositAmount ? `£${property.depositAmount.toLocaleString()}` : "—"}
          sub={`Protected · ${property.depositScheme ?? "—"}`}
          tone="good"
        />
        <Stat
          label="Open tasks"
          value={String(totalOpen)}
          sub={totalOpen === 0 ? "All caught up" : "Across your tenancy"}
          tone={totalOpen === 0 ? "good" : "neutral"}
        />
      </div>

      {/* Your home card */}
      <section>
        <h2
          className="font-medium text-muted-foreground"
          style={{ fontSize: "12px", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "10px" }}
        >
          Your home
        </h2>
        <button
          onClick={onOpenProperty}
          className="w-full text-left bg-card hairline rounded-xl flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
          style={{ padding: "14px 16px" }}
        >
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-foreground truncate">
              {property.address.split(",")[0]}
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {property.postcode}
            </p>
          </div>
          <span className="text-[12px] text-muted-foreground shrink-0">Open →</span>
        </button>
      </section>

      {/* Your landlord */}
      <section>
        <h2
          className="font-medium text-muted-foreground"
          style={{ fontSize: "12px", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "10px" }}
        >
          Your landlord
        </h2>
        <div className="bg-card hairline rounded-xl flex items-center gap-3" style={{ padding: "14px 16px" }}>
          <img
            src={LANDLORD_PROFILE.avatarUrl}
            alt={LANDLORD_PROFILE.name}
            className="rounded-full object-cover shrink-0"
            style={{ width: "44px", height: "44px" }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[14px] font-medium text-foreground truncate">
                {LANDLORD_PROFILE.name}
              </p>
              {LANDLORD_PROFILE.verified && (
                <span className="text-[10px] tabular-nums" style={{ color: PURPLE }}>✓ verified</span>
              )}
            </div>
            <p className="text-[12px] text-muted-foreground mt-0.5 tabular-nums">
              {LANDLORD_PROFILE.rating.toFixed(1)} ★ · {LANDLORD_PROFILE.reviewCount} reviews
            </p>
          </div>
          <button
            onClick={onOpenProperty}
            className="text-[13px] text-foreground hairline rounded-lg shrink-0"
            style={{ padding: "6px 14px" }}
          >
            Message
          </button>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label, value, sub, tone,
}: {
  label: string; value: string; sub: string; tone: "good" | "danger" | "neutral";
}) {
  const subColor =
    tone === "good" ? GREEN :
    tone === "danger" ? RED_MID :
    "hsl(var(--muted-foreground))";
  return (
    <div className="bg-card hairline rounded-xl" style={{ padding: "14px 16px" }}>
      <p
        className="text-[11px] text-muted-foreground"
        style={{ letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 500 }}
      >
        {label}
      </p>
      <p className="text-[20px] font-medium text-foreground tabular-nums tracking-tight mt-1.5">
        {value}
      </p>
      <p className="text-[11px] tabular-nums mt-0.5" style={{ color: subColor }}>
        {sub}
      </p>
    </div>
  );
}
