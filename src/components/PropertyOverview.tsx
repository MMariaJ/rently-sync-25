import { useState } from "react";
import type { Property, VaultDoc } from "@/data/constants";
import { TasksTab } from "./TasksTab";
import { VaultTab } from "./VaultTab";
import { CommsTab } from "./CommsTab";
import { PaymentsTab } from "./PaymentsTab";
import { ReviewsTab } from "./ReviewsTab";

interface PropertyOverviewProps {
  property: Property;
  completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>;
  onBack: () => void;
}

type TabKey = "Overview" | "Tasks" | "Vault" | "Comms" | "Payments" | "Reviews";

interface HmoTenant {
  initials: string;
  name: string;
  rent: number;
  since: string;
  status: "Paid" | "Due soon" | "Late";
  avatarBg: string;
  avatarFg: string;
  stage: "Pre-move-in" | "Move-in" | "Active tenancy" | "Move-out";
  alert?: { text: string; severity: "warn" | "danger" };
}

interface OverviewData {
  postcode: string;
  rating: number;
  reviewCount: number;
  rent: number;
  isHmo?: boolean;
  hero: {
    headline: string;
    subline: string;
    cta: string;
    tone?: "danger" | "neutral";
  };
  tenant?: {
    initials: string;
    name: string;
    rating: number;
    since: string;
  };
  hmoTenants?: HmoTenant[];
  activity: { title: string; date: string }[];
  upcoming: {
    label: string;
    items: {
      title: string;
      sub: string;
      right: string;
      overdue?: boolean;
    }[];
  }[];
}

// Hardcoded per-property overview data. Currently spec'd for p2 (7 Crane Wharf).
const DATA_BY_ID: Record<string, OverviewData> = {
  p2: {
    postcode: "Greenwich SE10 0LN",
    rating: 4.7,
    reviewCount: 5,
    rent: 1800,
    hero: {
      headline: "EPC certificate expired 3 days ago",
      subline: "This blocks James's move-in. Fines start at £5,000 · about 10 minutes to fix.",
      cta: "Renew now",
    },
    tenant: {
      initials: "JO",
      name: "James Okafor",
      rating: 4.7,
      since: "March 2025",
    },
    activity: [
      { title: "Rent paid · £1,800", date: "3 Apr" },
      { title: "Gas safety inspection booked", date: "28 Mar" },
      { title: "Message from James · \u201CIs parking included?\u201D", date: "25 Mar" },
      { title: "Deposit protected · £2,700", date: "20 Mar" },
      { title: "Tenancy agreement signed", date: "15 Mar" },
    ],
    upcoming: [
      {
        label: "Overdue",
        items: [
          { title: "EPC Certificate", sub: "Expired 3 days ago", right: "Overdue", overdue: true },
        ],
      },
      {
        label: "Later this year",
        items: [
          { title: "EICR Report", sub: "Electrical safety", right: "110 days" },
          { title: "Annual rent review", sub: "AST renewal window opens", right: "280 days" },
        ],
      },
    ],
  },
  p1: {
    postcode: "London SE4 2BN",
    rating: 4.9,
    reviewCount: 3,
    rent: 1450,
    hero: {
      headline: "All compliant — Gas safety renews in 81 days",
      subline: "Nothing urgent. We'll remind you 30 days before the deadline.",
      cta: "View tasks",
    },
    tenant: {
      initials: "SM",
      name: "Sarah Mitchell",
      rating: 4.9,
      since: "February 2026",
    },
    activity: [
      { title: "Rent paid · £1,450", date: "1 Apr" },
      { title: "Tenancy agreement signed", date: "1 Feb" },
      { title: "Deposit protected · £2,175", date: "28 Jan" },
      { title: "Move-in inventory completed", date: "1 Feb" },
      { title: "Tenant verified", date: "20 Jan" },
    ],
    upcoming: [
      {
        label: "This year",
        items: [
          { title: "Gas Safety Certificate", sub: "Annual inspection", right: "81 days" },
          { title: "EICR Report", sub: "Electrical safety", right: "210 days" },
        ],
      },
    ],
  },
  p3: {
    postcode: "Hackney E8 1QP",
    rating: 4.5,
    reviewCount: 6,
    rent: 1870,
    isHmo: true,
    hero: {
      headline: "AST renewal window opens in 95 days",
      subline: "Three tenants, three contracts. We'll surface each one as their renewal approaches.",
      cta: "Plan renewals",
      tone: "neutral",
    },
    hmoTenants: [
      { initials: "MC", name: "Mia Chen",      rent: 650, since: "Jan 2026", status: "Paid",     avatarBg: "#E1ECF7", avatarFg: "#2E5A8C", stage: "Active tenancy" },
      { initials: "KA", name: "Kwame Asante",  rent: 620, since: "Feb 2026", status: "Paid",     avatarBg: "#EAF3DE", avatarFg: "#3B6D11", stage: "Active tenancy" },
      { initials: "SR", name: "Sofia Rossi",   rent: 600, since: "Mar 2026", status: "Due soon", avatarBg: "#F7E8DD", avatarFg: "#8C4A1F", stage: "Active tenancy", alert: { text: "Rent due in 3 days · gentle reminder suggested", severity: "warn" } },
    ],
    activity: [
      { title: "Rent paid · £650 (Mia)", date: "1 Apr" },
      { title: "Rent paid · £620 (Kwame)", date: "1 Apr" },
      { title: "Message from Sofia · \u201CWhen is the boiler service?\u201D", date: "29 Mar" },
      { title: "HMO licence inspection passed", date: "22 Mar" },
      { title: "Sofia Rossi moved in", date: "1 Mar" },
    ],
    upcoming: [
      {
        label: "This year",
        items: [
          { title: "AST renewal — Mia Chen", sub: "Lease ends 31 Dec 2026", right: "95 days" },
          { title: "Deposit Protection — Kwame", sub: "Re-protection window", right: "130 days" },
          { title: "Gas Safety Certificate", sub: "Annual inspection", right: "248 days" },
        ],
      },
    ],
  },
};

const TABS: TabKey[] = ["Overview", "Tasks", "Vault", "Comms", "Payments", "Reviews"];

export function PropertyOverview({ property, onBack }: PropertyOverviewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("Overview");
  const data = DATA_BY_ID[property.id] ?? DATA_BY_ID.p2;
  const name = property.address.split(",")[0];

  // Soft red palette for hero
  const RED_BG = "#FBECEC";
  const RED_DARK = "#791F1F";
  const RED_MID = "#A32D2D";
  const RED_ACCENT = "#E24B4A";
  const PURPLE = "#534AB7";

  return (
    <div className="space-y-4 pb-12">
      {/* Breadcrumb */}
      <button
        onClick={onBack}
        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        style={{ color: "hsl(var(--muted-foreground) / 0.7)" }}
      >
        ← All properties
      </button>

      {/* Header row */}
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-[20px] font-medium text-foreground tracking-tight">{name}</h1>
        <div className="flex items-center text-[13px] text-muted-foreground" style={{ gap: "16px" }}>
          <span>{data.postcode}</span>
          <span className="tabular-nums">{data.rating.toFixed(1)} ★ · {data.reviewCount} reviews</span>
          <span className="tabular-nums">£{data.rent.toLocaleString()}/mo</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-5 hairline-b">
        {TABS.map((t) => {
          const active = t === activeTab;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="relative pb-2.5 text-[13px] transition-colors"
              style={{
                color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                fontWeight: active ? 500 : 400,
              }}
            >
              {t}
              {active && (
                <span
                  className="absolute left-0 right-0 -bottom-px"
                  style={{ height: "2px", backgroundColor: "hsl(var(--foreground))" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {activeTab !== "Overview" ? (
        <div className="bg-card hairline rounded-xl p-12 text-center">
          <p className="text-muted-foreground text-[13px]">{activeTab} — coming in the next iteration</p>
        </div>
      ) : (
        <>
          {/* Hero action card */}
          {(() => {
            const neutral = data.hero.tone === "neutral";
            const bg = neutral ? "#F2F4F0" : RED_BG;
            const headColor = neutral ? "#1F5A3A" : RED_DARK;
            const subColor = neutral ? "#3A7355" : RED_MID;
            const btnBg = neutral ? "#1F5A3A" : RED_DARK;
            return (
              <div
                className="rounded-xl flex items-center justify-between gap-4"
                style={{ backgroundColor: bg, padding: "1rem 1.25rem" }}
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-medium" style={{ color: headColor }}>
                    {data.hero.headline}
                  </p>
                  <p className="text-[13px] mt-1" style={{ color: subColor }}>
                    {data.hero.subline}
                  </p>
                </div>
                <button
                  className="shrink-0 text-[13px] font-medium text-white"
                  style={{ backgroundColor: btnBg, borderRadius: "8px", padding: "8px 16px" }}
                >
                  {data.hero.cta}
                </button>
              </div>
            );
          })()}

          {/* Lifecycle tracker */}
          {(() => {
            const isHmo = !!data.isHmo;
            const stages = isHmo
              ? [
                  { name: "Pre-move-in", count: "all done", active: false },
                  { name: "Move-in", count: "all done", active: false },
                  { name: "Active tenancy", count: "ongoing", active: true },
                  { name: "Move-out", count: "no open tasks", active: false },
                ]
              : [
                  { name: "Pre-move-in", count: "1 task open", active: true },
                  { name: "Move-in", count: "no open tasks", active: false },
                  { name: "Active tenancy", count: "ongoing", active: false },
                  { name: "Move-out", count: "no open tasks", active: false },
                ];
            const summary = isHmo ? "All tenancies in active stage" : "1 open in 1 stage";
            const nextUp = isHmo ? "Schedule annual gas safety inspection" : "Set initial meter readings";
            return (
              <div className="bg-card hairline rounded-xl" style={{ padding: "1.25rem" }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[13px] text-muted-foreground">Your lifecycle tasks</span>
                  <span className="text-[12px] text-muted-foreground">{summary}</span>
                </div>

                <div className="flex" style={{ gap: "8px" }}>
                  {stages.map((s) => (
                    <div key={s.name} className="flex-1 flex flex-col" style={{ gap: "6px" }}>
                      <div
                        style={{
                          height: "4px",
                          borderRadius: "2px",
                          backgroundColor: s.active ? PURPLE : "hsl(var(--border))",
                        }}
                      />
                      <span
                        className="text-[12px]"
                        style={{
                          color: s.active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                          fontWeight: s.active ? 500 : 400,
                        }}
                      >
                        {s.name}
                      </span>
                      <span
                        className="text-[11px]"
                        style={{
                          color: s.active
                            ? "hsl(var(--muted-foreground))"
                            : "hsl(var(--muted-foreground) / 0.7)",
                        }}
                      >
                        {s.count}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  className="hairline-t flex items-center justify-between gap-3"
                  style={{ marginTop: "14px", paddingTop: "14px" }}
                >
                  <div className="min-w-0">
                    <p className="text-[12px] text-muted-foreground">Next up</p>
                    <p className="text-[14px] font-medium text-foreground mt-0.5">{nextUp}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="text-[13px] text-foreground hairline rounded-lg" style={{ padding: "6px 14px" }}>
                      Mark done
                    </button>
                    <button className="text-[13px] text-muted-foreground hairline rounded-lg" style={{ padding: "6px 10px" }}>
                      See all tasks →
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* HMO: per-tenant cards directly below lifecycle */}
          {data.isHmo && data.hmoTenants && (
            <section>
              <h2
                className="font-medium text-muted-foreground"
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                }}
              >
                {`Tenants · ${data.hmoTenants.length}`}
              </h2>

              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {data.hmoTenants.map((t) => {
                  const statusColor =
                    t.status === "Paid" ? "#3B6D11" :
                    t.status === "Late" ? "#A32D2D" : "#8C4A1F";
                  const statusBg =
                    t.status === "Paid" ? "#EAF3DE" :
                    t.status === "Late" ? "#FBECEC" : "#F7E8DD";
                  const alertColor = t.alert?.severity === "danger" ? RED_MID : "#8C4A1F";
                  const alertBg = t.alert?.severity === "danger" ? "#FBECEC" : "#F7E8DD";
                  return (
                    <div
                      key={t.name}
                      className="bg-card hairline rounded-xl flex flex-col"
                      style={{ padding: "14px 16px", gap: "12px" }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="rounded-full flex items-center justify-center shrink-0"
                          style={{
                            width: "40px", height: "40px",
                            backgroundColor: t.avatarBg, color: t.avatarFg,
                            fontSize: "13px", fontWeight: 500,
                          }}
                        >
                          {t.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-foreground truncate">{t.name}</p>
                          <p className="text-[12px] text-muted-foreground mt-0.5 tabular-nums">
                            £{t.rent}/mo · since {t.since}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className="text-[11px]"
                          style={{
                            color: "hsl(var(--muted-foreground))",
                            backgroundColor: "hsl(var(--secondary))",
                            padding: "2px 8px",
                            borderRadius: "8px",
                          }}
                        >
                          {t.stage}
                        </span>
                        <span
                          className="text-[11px]"
                          style={{
                            color: statusColor, backgroundColor: statusBg,
                            padding: "2px 8px", borderRadius: "8px",
                          }}
                        >
                          {t.status}
                        </span>
                      </div>

                      {t.alert && (
                        <div
                          className="rounded-lg"
                          style={{
                            backgroundColor: alertBg,
                            color: alertColor,
                            padding: "8px 10px",
                            fontSize: "12px",
                            lineHeight: 1.35,
                          }}
                        >
                          {t.alert.text}
                        </div>
                      )}

                      <button
                        className="text-[12px] text-muted-foreground hover:text-foreground transition-colors text-left"
                      >
                        Message →
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Body grid: 2-col for single-let, 1-col for HMO (no shared activity, tenant cards above) */}
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: data.isHmo ? "1fr" : "1.2fr 1fr" }}
          >
            {/* Tenant + Recent activity column — single-let only */}
            {!data.isHmo && data.tenant && (
              <section>
                <h2
                  className="font-medium text-muted-foreground"
                  style={{
                    fontSize: "12px",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    marginBottom: "10px",
                  }}
                >
                  Tenant
                </h2>

                <div className="bg-card hairline rounded-xl" style={{ padding: "14px 16px" }}>
                  <div className="flex items-center" style={{ gap: "12px", marginBottom: "12px" }}>
                    <div
                      className="rounded-full flex items-center justify-center shrink-0"
                      style={{
                        width: "44px", height: "44px",
                        backgroundColor: "#E1ECF7", color: "#2E5A8C",
                        fontSize: "14px", fontWeight: 500,
                      }}
                    >
                      {data.tenant.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-medium text-foreground">
                          {data.tenant.name}
                        </span>
                        <span
                          className="text-[11px]"
                          style={{
                            color: "#3B6D11", backgroundColor: "#EAF3DE",
                            padding: "2px 8px", borderRadius: "8px",
                          }}
                        >
                          Verified
                        </span>
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-1 tabular-nums">
                        {data.tenant.rating.toFixed(1)} ★ · tenant since {data.tenant.since}
                      </p>
                    </div>
                    <button className="text-[12px] text-muted-foreground shrink-0 hover:text-foreground transition-colors">
                      Message →
                    </button>
                  </div>

                  <div className="hairline-t" style={{ paddingTop: "12px" }}>
                    <p
                      className="font-medium"
                      style={{
                        fontSize: "11px",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        color: "hsl(var(--muted-foreground) / 0.7)",
                        marginBottom: "8px",
                      }}
                    >
                      Recent activity
                    </p>
                    {data.activity.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 text-[13px]"
                        style={{ padding: "4px 0" }}
                      >
                        <span className="text-foreground truncate">{a.title}</span>
                        <span
                          className="shrink-0 tabular-nums"
                          style={{ color: "hsl(var(--muted-foreground) / 0.7)" }}
                        >
                          {a.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* What's coming up */}
            <section>
              <h2
                className="font-medium text-muted-foreground"
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                }}
              >
                What's coming up
              </h2>

              <div className="bg-card hairline rounded-xl" style={{ padding: "4px 0" }}>
                {data.upcoming.map((group, gi) => (
                  <div
                    key={group.label}
                    className={gi > 0 ? "hairline-t" : ""}
                    style={gi > 0 ? { marginTop: "4px" } : undefined}
                  >
                    <p
                      className="font-medium"
                      style={{
                        fontSize: "11px",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        color: "hsl(var(--muted-foreground) / 0.7)",
                        padding: "10px 16px 4px 16px",
                      }}
                    >
                      {group.label}
                    </p>
                    {group.items.map((it) => (
                      <div
                        key={it.title}
                        className="flex items-center justify-between gap-3"
                        style={{
                          padding: "8px 16px",
                          borderLeft: it.overdue ? `3px solid ${RED_ACCENT}` : undefined,
                        }}
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground">{it.title}</p>
                          <p className="text-[12px] text-muted-foreground mt-0.5">{it.sub}</p>
                        </div>
                        <span
                          className="text-[12px] shrink-0 tabular-nums"
                          style={{
                            color: it.overdue ? RED_MID : "hsl(var(--muted-foreground))",
                            fontWeight: it.overdue ? 500 : 400,
                          }}
                        >
                          {it.right}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
