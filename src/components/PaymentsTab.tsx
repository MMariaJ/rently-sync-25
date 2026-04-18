import { cn } from "@/lib/utils";
import {
  HMO_TENANTS, HMO_UTILITIES, RELIABILITY_HISTORY, PAYMENT_HISTORY_MONTHS,
  TENANT_INFO,
  type Property,
} from "@/data/constants";

interface PaymentsTabProps {
  property: Property;
}

// Shared palette — reused from the rest of the app.
const PURPLE = "#534AB7";
const GREEN = "#3B6D11";
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

export function PaymentsTab({ property: p }: PaymentsTabProps) {
  return <PaymentsView property={p} />;
}

// =============================================================
// Unified Payments view — same skeleton for HMO and single-let.
// Single-let renders a one-row tenant list and skips utilities by default.
// =============================================================
function PaymentsView({ property: p }: { property: Property }) {
  const tenants = tenantsForProperty(p);
  const utilities = HMO_UTILITIES[p.id] ?? [];
  const history = PAYMENT_HISTORY_MONTHS[p.id] ?? [];
  const reliability = RELIABILITY_HISTORY[p.id] ?? [];

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
      <SectionLabel>Rent · {currentMonth}</SectionLabel>
      <Card>
        {/* a) Headline */}
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <p className="text-foreground">
            <span className="text-[24px] font-medium tabular-nums tracking-tight">
              £{collected.toLocaleString()}
            </span>
            <span className="text-[13px] text-muted-foreground tabular-nums ml-1.5">
              of £{totalRent.toLocaleString()} collected
            </span>
          </p>
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
                  : `Due ${t.dueDate} · reliable payer (${t.reliability.onTime}/${t.reliability.total})`;
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
                    {t.name} · Room {t.room}
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

        {/* d) Reliability strip */}
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
      </Card>

      {/* ============ DEPOSITS ============ */}
      <SectionHeader
        left={`Deposits · £${totalDeposit.toLocaleString()} protected`}
        right={
          <>
            All schemes current {SPARK}
          </>
        }
      />
      <Card padded={false}>
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
                {t.name} · Room {t.room}
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
      </Card>

      {/* ============ UTILITIES ============ */}
      {p.utilityMode === "landlord-pays" && utilities.length > 0 && (
        <>
          <SectionHeader
            left={`Utilities · ${currentMonth}`}
            right={`Landlord pays · split ${occupied} ways`}
          />
          <Card padded={false}>
            {utilities.map((u, i) => {
              const perTenant = Math.round(u.amount / occupied);
              const statusLabel =
                u.status === "paid" ? "Paid" :
                u.status === "overdue" ? "Overdue" : "Upcoming";
              const statusColor =
                u.status === "paid" ? GREEN :
                u.status === "overdue" ? RED_DARK : "hsl(var(--muted-foreground))";
              return (
                <div
                  key={u.id}
                  className={cn(
                    "flex items-start justify-between gap-3",
                    i > 0 && "hairline-t",
                  )}
                  style={{ padding: "10px 16px" }}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                      {u.type}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {u.provider} · due {u.dueDate}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] text-muted-foreground tabular-nums">
                      £{perTenant}/tenant
                    </p>
                    <p className="text-[13px] text-foreground tabular-nums" style={{ fontWeight: 500 }}>
                      £{u.amount.toLocaleString()}
                    </p>
                    <p className="text-[11px] tabular-nums" style={{ color: statusColor }}>
                      {statusLabel}
                    </p>
                  </div>
                </div>
              );
            })}
          </Card>
        </>
      )}

      {/* ============ PAYMENT HISTORY ============ */}
      <SectionLabel>Payment history</SectionLabel>
      <Card padded={false}>
        {history.slice(0, 3).map((h, i) => {
          const sentence =
            h.lateCount === 0
              ? "all on time"
              : `${h.lateCount} late payment${h.lateCount > 1 ? "s" : ""}`;
          const subtitle =
            h.utilitiesTotal > 0
              ? `Rent £${h.rentTotal.toLocaleString()} · utilities £${h.utilitiesTotal.toLocaleString()} · ${sentence}`
              : `Rent £${h.rentTotal.toLocaleString()} · ${sentence}`;
          return (
            <div
              key={h.monthLabel}
              className={cn(
                "flex items-start justify-between gap-3",
                i > 0 && "hairline-t",
              )}
              style={{ padding: "10px 16px" }}
            >
              <div className="min-w-0">
                <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                  {h.monthLabel}
                </p>
                <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                  {subtitle}
                </p>
              </div>
              <button className="text-[12px] text-muted-foreground hover:text-foreground transition-colors shrink-0">
                View →
              </button>
            </div>
          );
        })}
      </Card>
      <p className="text-[12px] text-muted-foreground text-center" style={{ marginTop: "10px" }}>
        Showing 3 months ·{" "}
        <button className="hover:text-foreground transition-colors">view all →</button>
      </p>
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
// Single-let view — original behaviour, untouched logic.
// =============================================================
function SingleLetPaymentsView({ property: p }: { property: Property }) {
  const payments = PAYMENTS_BY_PROP[p.id] || [];
  const recurring = RECURRING_PAYMENTS[p.id] || [];
  const missedCount = payments.filter(pm => pm.status === "missed").length;
  const [showHashes, setShowHashes] = useState<Set<number>>(new Set());

  const depositStage = p.depositRef ? 2 : 0;

  const toggleHash = (i: number) => {
    setShowHashes(prev => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {missedCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-danger-muted">
          <div className="flex-1">
            <p className="text-[14px] text-danger font-medium">{missedCount} missed payment{missedCount > 1 ? "s" : ""}</p>
            <p className="text-[12px] text-danger/70">Send a reminder via communications.</p>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-danger text-danger-foreground text-[12px] font-medium hover:opacity-90 transition-opacity">
            Send reminder
          </button>
        </div>
      )}

      <div className="bg-card hairline rounded-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="label-eyebrow">Monthly rent</p>
          <span className="text-[12px] text-muted-foreground">via Open Banking</span>
        </div>
        <p className="text-[28px] tabular-nums text-foreground font-medium tracking-tight mt-1">£{p.rent.toLocaleString()}</p>
      </div>

      <div className="bg-card hairline rounded-xl overflow-hidden">
        <div className="px-5 py-4 hairline-b">
          <p className="text-[13px] text-foreground font-medium">Payment history</p>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[13px] text-muted-foreground">No payment history yet.</p>
          </div>
        ) : (
          <div>
            {payments.map((pm, i) => (
              <div key={i} className={cn("px-5 py-3.5 flex items-center gap-4", i > 0 && "hairline-t")}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-foreground tabular-nums font-medium">{pm.amount}</span>
                    <span className={cn(
                      "text-[11px]",
                      pm.status === "verified" ? "text-muted-foreground" : "text-danger"
                    )}>
                      {pm.status === "verified" ? "Verified" : "Missed"}
                    </span>
                  </div>
                  <span className="text-[12px] text-muted-foreground">{pm.date}</span>
                  {showHashes.has(i) && pm.hash && (
                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground font-mono">
                      <Hash className="w-3 h-3" /> SHA-256: {pm.hash}
                    </div>
                  )}
                </div>

                {pm.hash && (
                  <button
                    onClick={() => toggleHash(i)}
                    className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showHashes.has(i) ? "Hide hash" : "Show hash"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {p.depositRef && (
        <div className="bg-card hairline rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="label-eyebrow">Deposit lifecycle</p>
            <span className="text-[12px] text-muted-foreground">{p.depositScheme} · {p.depositRef}</span>
          </div>

          <div className="flex items-center gap-1 mt-5">
            {DEPOSIT_STAGES.map((stage, i) => {
              const isComplete = i < depositStage;
              const isCurrent = i === depositStage;
              return (
                <div key={stage} className="flex-1 flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-[11px] tabular-nums shrink-0",
                    isComplete ? "bg-foreground text-background" :
                    isCurrent ? "bg-primary text-primary-foreground font-medium" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {isComplete ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={cn(
                    "text-[11px] text-center leading-tight",
                    isComplete || isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {recurring.length > 0 && (
        <div className="bg-card hairline rounded-xl overflow-hidden">
          <div className="px-5 py-4 hairline-b">
            <p className="text-[13px] text-foreground font-medium">Recurring payments</p>
          </div>
          <div>
            {recurring.map((rp, i) => (
              <div key={rp.id} className={cn("px-5 py-3.5 flex items-center justify-between", i > 0 && "hairline-t")}>
                <div>
                  <p className="text-[13px] text-foreground font-medium">{rp.label}</p>
                  <p className="text-[12px] text-muted-foreground">{rp.provider} · due {rp.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] text-foreground tabular-nums font-medium">£{rp.amount}</p>
                  <span className={cn(
                    "text-[11px]",
                    rp.status === "paid" ? "text-muted-foreground" :
                    rp.status === "overdue" ? "text-danger" :
                    rp.status === "due_soon" ? "text-warning" :
                    "text-muted-foreground"
                  )}>
                    {rp.status === "paid" ? "Paid" :
                     rp.status === "overdue" ? "Overdue" :
                     rp.status === "due_soon" ? "Due soon" : "Upcoming"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
