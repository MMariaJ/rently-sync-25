import { cn } from "@/lib/utils";
import {
  HMO_TENANTS, RELIABILITY_HISTORY, PAYMENTS_BY_PROP,
  TENANT_INFO, TENANCY_INFO,
  RELIABILITY_TIERS,
  type Property, type Utility, type BillTenantStatus, type ReliabilityTier, type VaultDoc,
} from "@/data/constants";
import {
  getUtilitiesForProperty,
  getReliabilityScore,
  getMonthlyReliabilityStrip,
  getTenantUtilityPlaceholders,
  type ReliabilityStripMonth,
} from "@/data/helpers";
import { getTenantPhase } from "@/state/tenantEngine";

interface PaymentsTabProps {
  property: Property;
  // Optional — defaults to landlord view. When set to "tenant" the rent +
  // utility sections gate on the tenant's lifecycle phase (Move-In or later)
  // and synthesise placeholder utility rows for any setup tasks the tenant
  // has completed.
  role?: "tenant" | "landlord";
  completed?: Record<string, boolean>;
  allVaults?: Record<string, VaultDoc[]>;
}

// Shared palette — reused from the rest of the app.
const PURPLE = "#534AB7";
const GREEN = "#3B6D11";
// Protected-deposit left accent — a mid-green that reads as "all good"
// without competing with status labels.
const GREEN_ACCENT = "#9CCB6A";
const RED = "#E24B4A";
const RED_DARK = "#A32D2D";
const RED_TINT = "#FCEBEB";
const NEUTRAL_GREY_BG = "#F4F4F5";
const TINT_GREY = "#E4E4E7";

const SPARK = (
  <span style={{ color: PURPLE, fontWeight: 500 }} aria-hidden="true">✦</span>
);

// Unified tenant row shape, whether the property is HMO or single-let.
interface PaymentTenant {
  id: string;
  name: string;
  room?: string;
  rent: number;
  deposit: number;
  depositScheme: string;
  depositRef: string;
  paymentStatus: "paid" | "upcoming" | "late";
  paymentRef: string;
  paidDate?: string;
  dueDate: string;
  daysLate?: number;
  reliability: { onTime: number; total: number };
}

function tenantsForProperty(p: Property): PaymentTenant[] {
  if (p.isHmo) {
    return (HMO_TENANTS[p.id] ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      room: t.room,
      rent: t.rent,
      deposit: t.deposit,
      depositScheme: t.depositScheme,
      depositRef: t.depositRef,
      paymentStatus: t.paymentStatus,
      paymentRef: t.paymentRef,
      paidDate: t.paidDate,
      dueDate: t.dueDate,
      daysLate: t.daysLate,
      reliability: t.reliability,
    }));
  }
  // Single-let: synthesise a one-row list from Property + TenantInfo.
  const info = TENANT_INFO[p.id];
  return [
    {
      id: `${p.id}-tenant`,
      name: info?.name ?? p.tenant,
      rent: p.rent,
      deposit: p.depositAmount ?? 0,
      depositScheme: p.depositScheme ?? "—",
      depositRef: p.depositRef ?? "—",
      paymentStatus: p.paymentStatus ?? "upcoming",
      paymentRef: p.paymentRef ?? "—",
      paidDate: p.paidDate,
      dueDate: p.dueDate ?? "—",
      daysLate: p.daysLate,
      reliability: p.reliability ?? { onTime: 0, total: 0 },
    },
  ];
}

export function PaymentsTab({ property: p, role, completed, allVaults }: PaymentsTabProps) {
  return <PaymentsView property={p} role={role ?? "landlord"} completed={completed} allVaults={allVaults} />;
}

// =============================================================
// Unified Payments view — same skeleton for HMO and single-let.
// =============================================================
function PaymentsView({
  property: p,
  role,
  completed,
  allVaults,
}: {
  property: Property;
  role: "tenant" | "landlord";
  completed?: Record<string, boolean>;
  allVaults?: Record<string, VaultDoc[]>;
}) {
  const tenants = tenantsForProperty(p);
  const realUtilities = getUtilitiesForProperty(p.id);
  const placeholderUtilities =
    role === "tenant" && completed ? getTenantUtilityPlaceholders(p.id, completed) : [];
  const utilities = [...realUtilities, ...placeholderUtilities];
  const reliability = RELIABILITY_HISTORY[p.id] ?? [];

  // Landlord keeps its TENANCY_INFO gating. For tenant, gate on the derived
  // lifecycle phase so the rent card + utility placeholders only surface
  // once the tenant has actually reached Move-In. Before that point, only
  // the Deposits section renders — same as the landlord's pre-move-in view.
  const landlordPreMoveIn = TENANCY_INFO[p.id]?.currentPhase === "Pre-Move-In";
  const tenantPhase =
    role === "tenant" && completed && allVaults
      ? getTenantPhase(p, completed, allVaults)
      : null;
  const tenantPreMoveIn = tenantPhase === "Pre-Move-In";
  const isPreMoveIn = role === "tenant" ? tenantPreMoveIn : landlordPreMoveIn;

  // A first-time tenant has no rent-payment history yet. We surface the
  // rent card (so the expected amount is visible) but suppress the "of
  // X collected" counter and the 6-month reliability strip — both are
  // fictions before the first payment clears.
  const hasRentHistory = (PAYMENTS_BY_PROP[p.id] ?? []).length > 0;
  const isFirstTimeTenant = role === "tenant" && !hasRentHistory;

  // Derived totals — never stored, computed from the tenant array.
  const totalRent = tenants.reduce((s, t) => s + t.rent, 0);
  const collected = tenants
    .filter((t) => t.paymentStatus === "paid")
    .reduce((s, t) => s + t.rent, 0);
  const lateCount = tenants.filter((t) => t.paymentStatus === "late").length;
  const upcomingCount = tenants.filter((t) => t.paymentStatus === "upcoming").length;

  const totalDeposit = tenants.reduce((s, t) => s + t.deposit, 0);
  const occupied = tenants.length;

  const now = new Date();
  const currentMonth = now.toLocaleString("en-GB", { month: "long" });

  // Reliability summary
  const relExpected = reliability.reduce((s, m) => s + m.expected, 0);
  const relPaid = reliability.reduce((s, m) => s + m.paidOnTime, 0);

  // Status pill content for the headline row
  const statusPill = (() => {
    if (lateCount > 0) {
      return {
        label: `${lateCount} late`,
        bg: RED_TINT,
        color: RED_DARK,
      };
    }
    if (upcomingCount > 0) {
      return {
        label: `${upcomingCount} upcoming`,
        bg: NEUTRAL_GREY_BG,
        color: "hsl(var(--muted-foreground))",
      };
    }
    return { label: "all paid", bg: NEUTRAL_GREY_BG, color: "hsl(var(--muted-foreground))" };
  })();

  return (
    <div className="space-y-0 animate-fade-in" style={{ fontFeatureSettings: '"tnum"' }}>
      {/* ============ RENT THIS MONTH ============ */}
      {!isPreMoveIn && <>
      <SectionLabel>Rent · {currentMonth}</SectionLabel>
      <Card>
        {/* a) Headline */}
        <div className="flex items-baseline justify-between gap-3 mb-3">
          {isFirstTimeTenant ? (
            <p className="text-foreground">
              <span className="text-[24px] font-medium tabular-nums tracking-tight">
                £{totalRent.toLocaleString()}
              </span>
              <span className="text-[13px] text-muted-foreground tabular-nums ml-1.5">
                expected · no payments yet
              </span>
            </p>
          ) : (
            <p className="text-foreground">
              <span className="text-[24px] font-medium tabular-nums tracking-tight">
                £{collected.toLocaleString()}
              </span>
              <span className="text-[13px] text-muted-foreground tabular-nums ml-1.5">
                of £{totalRent.toLocaleString()} collected
              </span>
            </p>
          )}
          <span
            className="text-[11px] rounded-lg"
            style={{
              backgroundColor: statusPill.bg,
              color: statusPill.color,
              padding: "3px 8px",
              fontWeight: lateCount > 0 ? 500 : 400,
            }}
          >
            {statusPill.label}
          </span>
        </div>

        {/* b) Proportional segmented bar */}
        <div className="flex w-full mb-4" style={{ gap: "3px" }}>
          {tenants.map((t) => {
            const colour =
              t.paymentStatus === "paid" ? GREEN :
              t.paymentStatus === "late" ? RED : TINT_GREY;
            return (
              <div
                key={t.id}
                style={{
                  flexGrow: t.rent,
                  flexBasis: 0,
                  height: "6px",
                  borderRadius: "4px",
                  backgroundColor: colour,
                }}
                aria-label={`${t.name} ${t.paymentStatus}`}
              />
            );
          })}
        </div>

        {/* c) Per-tenant rows */}
        <div className="hairline-t pt-3">
          {tenants.map((t) => {
            const isPaid = t.paymentStatus === "paid";
            const isLate = t.paymentStatus === "late";
            const subtitle =
              isPaid
                ? `Paid ${t.paidDate} · ref ${t.paymentRef}`
                : isLate
                  ? `Due ${t.dueDate} · ${t.daysLate} days late`
                  : `Due ${t.dueDate}`;
            const statusLabel = isPaid ? "Paid" : isLate ? "Late" : "Upcoming";
            const statusColor = isPaid ? GREEN : isLate ? RED_DARK : "hsl(var(--muted-foreground))";

            return (
              <div
                key={t.id}
                className="flex items-start justify-between gap-3"
                style={{ paddingTop: "8px", paddingBottom: "8px" }}
              >
                <div className="min-w-0">
                  <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                    {t.name}{t.room ? ` · Room ${t.room}` : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                    {subtitle}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] text-foreground tabular-nums" style={{ fontWeight: 500 }}>
                    £{t.rent.toLocaleString()}
                  </p>
                  <p className="text-[11px] tabular-nums" style={{ color: statusColor }}>
                    {statusLabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* d) Reliability strip — suppressed for first-time tenants until
               the first payment actually clears and we have data to show. */}
        {isFirstTimeTenant ? (
          <div className="hairline-t" style={{ paddingTop: "14px", marginTop: "14px" }}>
            <p className="text-[11px] text-muted-foreground" style={{ textAlign: "center" }}>
              No payment history yet — your reliability score will start after your first rent.
            </p>
          </div>
        ) : (
          <div className="hairline-t" style={{ paddingTop: "14px", marginTop: "14px" }}>
            <div className="flex items-baseline justify-between">
              <p
                className="text-[11px] text-muted-foreground"
                style={{ letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 500 }}
              >
                Last 6 months
              </p>
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {relPaid} of {relExpected} paid on time
              </p>
            </div>
            <div className="flex w-full mt-2" style={{ gap: "4px" }}>
              {reliability.map((m) => (
                <ReliabilityBar key={m.month} month={m} />
              ))}
            </div>
            <div className="flex w-full mt-1" style={{ gap: "4px" }}>
              {reliability.map((m) => (
                <p
                  key={m.month}
                  className="text-[10px] text-muted-foreground text-center tabular-nums"
                  style={{ flex: "1 1 0" }}
                >
                  {m.month}
                </p>
              ))}
            </div>
          </div>
        )}
      </Card>
      </>}

      {/* ============ TENANT BILLS (utilities as reliability view) ============ */}
      {!isPreMoveIn && utilities.length > 0 && (
        <TenantBillsSection
          property={p}
          utilities={utilities}
          tenants={tenants}
          currentMonth={currentMonth}
        />
      )}

      {/* ============ DEPOSITS (always last) ============ */}
      <SectionHeader
        left={`Deposits · £${totalDeposit.toLocaleString()} protected`}
        right={
          <>
            All schemes current {SPARK}
          </>
        }
      />
      {/* Card with a left green accent strip to signal "protected". The
          hairline class's 0.5px left border is overridden by the 3px
          green so the whole section reads as safeguarded. */}
      <div
        className="bg-card hairline rounded-xl"
        style={{
          padding: "4px 0",
          marginBottom: "1.5rem",
          borderLeft: `3px solid ${GREEN_ACCENT}`,
        }}
      >
        {tenants.map((t, i) => (
          <div
            key={t.id}
            className={cn(
              "flex items-start justify-between gap-3",
              i > 0 && "hairline-t",
            )}
            style={{ padding: "10px 16px" }}
          >
            <div className="min-w-0">
              <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                {t.name}{t.room ? ` · Room ${t.room}` : ""}
              </p>
              <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                {t.depositScheme} · ref {t.depositRef} · {SPARK}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[13px] text-foreground tabular-nums" style={{ fontWeight: 500 }}>
                £{t.deposit.toLocaleString()}
              </p>
              <p className="text-[11px] tabular-nums" style={{ color: GREEN }}>Protected</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----- Small primitives shared inside the HMO view -----

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[12px] text-muted-foreground"
      style={{
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        fontWeight: 500,
        marginBottom: "10px",
      }}
    >
      {children}
    </p>
  );
}

function SectionHeader({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3" style={{ marginBottom: "10px" }}>
      <p
        className="text-[12px] text-muted-foreground"
        style={{ letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 500 }}
      >
        {left}
      </p>
      <p className="text-[11px] text-muted-foreground">{right}</p>
    </div>
  );
}

function Card({ children, padded = true }: { children: React.ReactNode; padded?: boolean }) {
  return (
    <div
      className="bg-card hairline rounded-xl"
      style={{
        padding: padded ? "1.25rem" : "4px 0",
        marginBottom: "1.5rem",
      }}
    >
      {children}
    </div>
  );
}

function ReliabilityBar({
  month,
}: {
  month: { month: string; expected: number; paidOnTime: number; collectedRatio?: number; inProgress?: boolean };
}) {
  const fullyPaid = month.paidOnTime === month.expected && !month.inProgress;
  const missed = month.paidOnTime < month.expected && !month.inProgress;

  // Current in-progress month: fill from bottom by collectedRatio
  if (month.inProgress) {
    const ratio = Math.max(0, Math.min(1, month.collectedRatio ?? 0));
    return (
      <div
        style={{
          flex: "1 1 0",
          height: "18px",
          borderRadius: "3px",
          backgroundColor: TINT_GREY,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: `${Math.round(ratio * 100)}%`,
            backgroundColor: GREEN,
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        flex: "1 1 0",
        height: "18px",
        borderRadius: "3px",
        backgroundColor: missed ? RED : fullyPaid ? GREEN : TINT_GREY,
      }}
    />
  );
}

// =============================================================
// Tenant bills — utility reliability view (single-let + HMO variants).
// =============================================================

// Today is pinned to the prototype's current date (2026-04-19).
const TODAY_ISO = "2026-04-19";

// Neutral tokens for the status dot + strip.
const STATUS_GREEN = "#639922";
const STATUS_AMBER = "#D4901A";
const STATUS_GREY = "#94A3B8";
const STRIP_EMPTY = "#E4E4E7";

function diffDaysFromToday(iso: string): number {
  const a = new Date(iso + "T00:00:00").getTime();
  const b = new Date(TODAY_ISO + "T00:00:00").getTime();
  return Math.round((a - b) / 86_400_000);
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Count late records for this tenant on this utility inside the current
// calendar year, *before* the given month. Used to produce "Nth late this year".
function priorLatesThisYear(util: Utility, tenantId: string, currentIso: string): number {
  const year = currentIso.slice(0, 4);
  let count = 0;
  for (const rec of util.paymentHistory) {
    if (!rec.monthIso.startsWith(year)) continue;
    if (rec.monthIso >= currentIso.slice(0, 7)) continue;
    if (rec.perTenant[tenantId]?.status === "late") count += 1;
  }
  return count;
}

function dotColour(status: BillTenantStatus): string {
  if (status === "paid") return STATUS_GREEN;
  if (status === "late") return RED;
  if (status === "pending") return STATUS_AMBER;
  return STATUS_GREY; // not-due
}

function StatusDot({ status }: { status: BillTenantStatus }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: "8px",
        height: "8px",
        borderRadius: "2px",
        backgroundColor: dotColour(status),
        marginRight: "8px",
        flexShrink: 0,
        transform: "translateY(1px)",
      }}
    />
  );
}

function ReliabilityPill({ tier }: { tier: ReliabilityTier }) {
  const spec = RELIABILITY_TIERS[tier];
  return (
    <span
      className="text-[11px]"
      style={{
        backgroundColor: spec.pillBg,
        color: spec.pillText,
        padding: "3px 8px",
        borderRadius: "8px",
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {spec.label}
    </span>
  );
}

// One segment of the 6-month reliability strip. When all bills in a month
// are on time it's fully green; when some were late it renders a gradient
// proportional to the on-time ratio (green left, red right). Months with
// no bills at all render as neutral grey.
function StripSegment({
  month,
  height,
  tier,
}: {
  month: ReliabilityStripMonth;
  height: number;
  tier: ReliabilityTier;
}) {
  const spec = RELIABILITY_TIERS[tier];
  let background: string;
  if (month.total === 0) {
    background = STRIP_EMPTY;
  } else if (month.onTime === month.total) {
    background = spec.stripOnTime;
  } else if (month.onTime === 0) {
    background = spec.stripLate;
  } else {
    const ratio = Math.round((month.onTime / month.total) * 100);
    background = `linear-gradient(to right, ${spec.stripOnTime} 0% ${ratio}%, ${spec.stripLate} ${ratio}% 100%)`;
  }
  return (
    <div
      aria-label={`${month.month}: ${month.onTime} of ${month.total} on time`}
      style={{
        flex: "1 1 0",
        height: `${height}px`,
        borderRadius: "3px",
        background,
      }}
    />
  );
}

function ReliabilityStrip({
  strip,
  tier,
  height,
  showLabels,
}: {
  strip: ReliabilityStripMonth[];
  tier: ReliabilityTier;
  height: number;
  showLabels?: boolean;
}) {
  return (
    <div>
      <div className="flex w-full" style={{ gap: "4px" }}>
        {strip.map(m => (
          <StripSegment key={m.monthIso} month={m} height={height} tier={tier} />
        ))}
      </div>
      {showLabels && (
        <div className="flex w-full mt-1" style={{ gap: "4px" }}>
          {strip.map(m => (
            <p
              key={m.monthIso}
              className="text-[10px] text-muted-foreground text-center tabular-nums"
              style={{ flex: "1 1 0" }}
            >
              {m.month}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// -------- Section wrapper --------

function TenantBillsSection({
  property: p,
  utilities,
  tenants,
  currentMonth,
}: {
  property: Property;
  utilities: Utility[];
  tenants: PaymentTenant[];
  currentMonth: string;
}) {
  const arrangement = p.utilityArrangement ?? (p.isHmo ? "landlord-pays-recharge" : "tenant-direct");
  const isHmo = tenants.length > 1;

  const right = (() => {
    if (arrangement === "landlord-pays-inclusive") {
      return "Tenant bills paid by landlord · included in rent";
    }
    if (arrangement === "landlord-pays-recharge") {
      return `Landlord pays · split ${tenants.length} ways · tenants reimburse`;
    }
    return "Tenant pays · verified via Open Banking";
  })();

  return (
    <>
      <SectionHeader left={`Tenant bills · ${currentMonth}`} right={right} />
      <div
        className="bg-card rounded-xl"
        style={{
          border: "0.5px solid hsl(var(--border))",
          borderRadius: "12px",
          marginBottom: "1.5rem",
          overflow: "hidden",
        }}
      >
        {isHmo ? (
          <HmoBills property={p} utilities={utilities} tenants={tenants} arrangement={arrangement} />
        ) : (
          <SingleLetBills property={p} utilities={utilities} tenant={tenants[0]} arrangement={arrangement} />
        )}
      </div>
    </>
  );
}

// -------- Single-let variant --------

function SingleLetBills({
  property: p,
  utilities,
  tenant,
  arrangement,
}: {
  property: Property;
  utilities: Utility[];
  tenant: PaymentTenant;
  arrangement: "tenant-direct" | "landlord-pays-inclusive" | "landlord-pays-recharge";
}) {
  // Inclusive: utilities are paid by the landlord as part of rent; the rows
  // exist for visibility but carry no payment-status data per the spec.
  const hideReliability = arrangement === "landlord-pays-inclusive";
  // Reliability footer only shows when at least one utility has real data.
  // A property whose rows are all placeholders (tenant just set up their
  // accounts) has nothing to score yet.
  const hasRealData = utilities.some(u => !u.placeholder);

  return (
    <>
      {utilities.map((u, i) => {
        if (u.placeholder) {
          return (
            <div
              key={u.id}
              className={cn(
                "flex items-center justify-between gap-3",
                i > 0 && "hairline-t",
              )}
              style={{ padding: "12px 16px" }}
            >
              <div className="min-w-0 flex items-center">
                <StatusDot status="not-due" />
                <div className="min-w-0">
                  <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                    {u.typeLabel}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Account linked · waiting for first bill
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                No bills yet
              </p>
            </div>
          );
        }

        const entry = u.currentBill.perTenant[tenant.id];
        const status: BillTenantStatus = hideReliability
          ? "not-due"
          : entry?.status ?? "not-due";
        const context = hideReliability
          ? "Included in rent"
          : behaviouralContext(u, tenant.id, status);

        return (
          <div
            key={u.id}
            className={cn(
              "flex items-center justify-between gap-3",
              i > 0 && "hairline-t",
            )}
            style={{ padding: "12px 16px" }}
          >
            <div className="min-w-0 flex items-center">
              {!hideReliability && <StatusDot status={status} />}
              <div className="min-w-0">
                <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                  {u.typeLabel}
                </p>
                <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                  {u.provider} · due {u.currentBill.dueDate}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p
                className="text-[12px] tabular-nums"
                style={{
                  fontWeight: 500,
                  color: statusTextColour(status),
                }}
              >
                {statusLabel(status)}
              </p>
              <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                {context}
              </p>
            </div>
          </div>
        );
      })}

      {!hideReliability && hasRealData && (
        <SingleLetReliabilityFooter property={p} tenant={tenant} />
      )}
    </>
  );
}

function SingleLetReliabilityFooter({
  property: p,
  tenant,
}: {
  property: Property;
  tenant: PaymentTenant;
}) {
  const score = getReliabilityScore(p.id, tenant.id, 6);
  const strip = getMonthlyReliabilityStrip(p.id, tenant.id, 6);

  return (
    <div className="hairline-t" style={{ padding: "14px 16px" }}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
            {tenant.name}
          </p>
          <p className="text-[12px] text-muted-foreground tabular-nums mt-0.5">
            <span style={{ fontWeight: 500, color: "hsl(var(--foreground))" }}>
              {score.onTime} of {score.total}
            </span>{" "}
            paid on time
          </p>
        </div>
        <ReliabilityPill tier={score.tier} />
      </div>
      <ReliabilityStrip strip={strip} tier={score.tier} height={18} showLabels />
    </div>
  );
}

// -------- HMO variant --------

function HmoBills({
  property: p,
  utilities,
  tenants,
  arrangement,
}: {
  property: Property;
  utilities: Utility[];
  tenants: PaymentTenant[];
  arrangement: "tenant-direct" | "landlord-pays-inclusive" | "landlord-pays-recharge";
}) {
  const hideReliability = arrangement === "landlord-pays-inclusive";

  return (
    <>
      {utilities.map((u, i) => {
        const entries = tenants.map(t => ({
          tenant: t,
          entry: u.currentBill.perTenant[t.id],
        }));
        const aggregate = aggregateStatus(entries.map(e => e.entry?.status ?? "not-due"));

        return (
          <div
            key={u.id}
            className={cn(i > 0 && "hairline-t")}
            style={{ padding: "14px 16px" }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                  {u.typeLabel}
                </p>
                <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                  {u.provider} · due {u.currentBill.dueDate} · £{u.currentBill.amount.toLocaleString()}
                </p>
              </div>
              <p
                className="text-[12px] tabular-nums shrink-0"
                style={{ fontWeight: 500, color: aggregateColour(aggregate) }}
              >
                {aggregateLabel(aggregate, entries.map(e => e.entry?.status ?? "not-due"))}
              </p>
            </div>

            {/* Split bar — one segment per tenant */}
            <div className="flex w-full" style={{ gap: "3px" }}>
              {entries.map(({ tenant, entry }) => {
                const status: BillTenantStatus = entry?.status ?? "not-due";
                const amount = entry?.amount ?? 0;
                const firstName = tenant.name.split(" ")[0];
                const label = segmentLabel(firstName, amount, status, entry?.daysLate);
                return (
                  <div
                    key={tenant.id}
                    style={{
                      flex: "1 1 0",
                      height: "22px",
                      borderRadius: "2px",
                      backgroundColor: segmentBg(status),
                      color: segmentFg(status),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 500,
                      fontFeatureSettings: '"tnum"',
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      padding: "0 6px",
                    }}
                    aria-label={`${tenant.name} ${status}`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
            {/* Outer radius frame — a thin wrapper lets the segments keep
                a smaller inner radius while the whole bar reads as one unit. */}
          </div>
        );
      })}

      {!hideReliability && <HmoReliabilityFooter property={p} tenants={tenants} />}
    </>
  );
}

function HmoReliabilityFooter({
  property: p,
  tenants,
}: {
  property: Property;
  tenants: PaymentTenant[];
}) {
  return (
    <div className="hairline-t" style={{ padding: "14px 16px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${tenants.length}, minmax(0, 1fr))`,
          gap: "12px",
        }}
      >
        {tenants.map(t => {
          const score = getReliabilityScore(p.id, t.id, 6);
          const strip = getMonthlyReliabilityStrip(p.id, t.id, 6);
          return (
            <div key={t.id} className="min-w-0">
              <p className="text-[12px] text-foreground truncate" style={{ fontWeight: 500 }}>
                {t.name.split(" ")[0]}
              </p>
              <div className="mt-1 mb-2">
                <ReliabilityPill tier={score.tier} />
              </div>
              <ReliabilityStrip strip={strip} tier={score.tier} height={12} />
              <p className="text-[10px] text-muted-foreground tabular-nums mt-1.5">
                {score.onTime} of {score.total} on time
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------- Copy + colour helpers --------

function behaviouralContext(util: Utility, tenantId: string, status: BillTenantStatus): string {
  const entry = util.currentBill.perTenant[tenantId];
  if (status === "paid" && entry?.paidDate) {
    const suffix =
      entry.daysEarly && entry.daysEarly > 0
        ? ` · ${entry.daysEarly} day${entry.daysEarly === 1 ? "" : "s"} early`
        : " · on due date";
    return `Paid on time · ${entry.paidDate}${suffix}`;
  }
  if (status === "late") {
    const days = entry?.daysLate ?? Math.max(0, -diffDaysFromToday(util.currentBill.dueDateIso));
    const prior = priorLatesThisYear(util, tenantId, util.currentBill.dueDateIso);
    const tally = prior === 0 ? "First late this year" : `${ordinal(prior + 1)} late this year`;
    return `Unpaid · ${days} day${days === 1 ? "" : "s"} late · ${tally}`;
  }
  if (status === "pending") {
    return "Awaiting confirmation";
  }
  // not-due
  const days = Math.max(0, diffDaysFromToday(util.currentBill.dueDateIso));
  return `Not yet due · ${days} day${days === 1 ? "" : "s"} away`;
}

function statusLabel(status: BillTenantStatus): string {
  if (status === "paid") return "Paid";
  if (status === "late") return "Unpaid";
  if (status === "pending") return "Pending";
  return "Not yet due";
}

function statusTextColour(status: BillTenantStatus): string {
  if (status === "paid") return "#27500A";
  if (status === "late") return RED_DARK;
  if (status === "pending") return "#854F0B";
  return "hsl(var(--muted-foreground))";
}

// Aggregate status across all tenants on one bill.
type Aggregate = "all-paid" | "partial-late" | "not-due";

function aggregateStatus(statuses: BillTenantStatus[]): Aggregate {
  if (statuses.every(s => s === "not-due")) return "not-due";
  if (statuses.some(s => s === "late")) return "partial-late";
  return "all-paid";
}

function aggregateLabel(agg: Aggregate, statuses: BillTenantStatus[]): string {
  if (agg === "not-due") return "Not yet due";
  if (agg === "all-paid") return "All reimbursed";
  const lateN = statuses.filter(s => s === "late").length;
  return `${lateN} outstanding`;
}

function aggregateColour(agg: Aggregate): string {
  if (agg === "all-paid") return "#27500A";
  if (agg === "partial-late") return RED_DARK;
  return "hsl(var(--muted-foreground))";
}

function segmentBg(status: BillTenantStatus): string {
  if (status === "paid") return "#C0DD97";
  if (status === "late") return "#F09595";
  return "#E4E4E7"; // not-due / pending
}

function segmentFg(status: BillTenantStatus): string {
  if (status === "paid") return "#173404";
  if (status === "late") return "#501313";
  return "#64748B";
}

function segmentLabel(
  name: string,
  amount: number,
  status: BillTenantStatus,
  daysLate?: number,
): string {
  if (status === "paid") return `${name} · £${amount} · paid`;
  if (status === "late") return `${name} · £${amount} · ${daysLate ?? 0}d late`;
  return `${name} · £${amount}`;
}

