import { useState } from "react";
import { TASK_DATA, PAYMENTS_BY_PROP, type Property, type VaultDoc } from "@/data/constants";
import { LifecycleTasksTab, naturalStage, type StageName } from "./LifecycleTasksTab";
import { LifecycleVaultTab } from "./LifecycleVaultTab";
import { CommsTab } from "./CommsTab";
import { PaymentsTab } from "./PaymentsTab";
import { ReviewsTab } from "./ReviewsTab";
import type { ActivityEvent, AppActions, ReviewEntry } from "@/state/useAppStore";
import type { ExtractedFacts, LifecyclePhase } from "@/state/engines";
import { getLifecyclePhase, getPhaseProgress } from "@/state/engines";

export interface PropertyOverviewProps {
  property: Property;
  completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>;
  taskUploads: Record<string, string>;
  extractedFacts: Record<string, ExtractedFacts>;
  events: ActivityEvent[];
  reviews: ReviewEntry[];
  onUploadDoc: AppActions["uploadDoc"];
  onUploadDocDirect: AppActions["uploadDocDirect"];
  onMarkTaskDone: AppActions["markTaskDone"];
  onUnmarkTaskDone: AppActions["unmarkTaskDone"];
  onSetReminder: AppActions["setReminder"];
  onFileCommsAttachment: AppActions["fileCommsAttachment"];
  onAddReview: AppActions["addReview"];
  onBack: () => void;
  initialTab?: TabKey;
}

export type TabKey = "Overview" | "Tasks" | "Vault" | "Comms" | "Payments" | "Reviews";

interface HmoTenant {
  initials: string;
  name: string;
  rent: number;
  since: string;
  status: "Paid" | "Due soon" | "Late";
  avatarBg: string;
  avatarFg: string;
  avatarUrl?: string;
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
    tone?: "danger" | "neutral" | "warning";
  };
  tenant?: {
    initials: string;
    name: string;
    rating: number;
    since: string;
    avatarUrl?: string;
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
      headline: "EPC certificate — renewal due in 28 days",
      subline: "Two items coming up: EPC renewal and smoke & CO alarm evidence. About 10 minutes each.",
      cta: "Plan renewal",
      tone: "warning",
    },
    tenant: {
      initials: "JO",
      name: "James Okafor",
      rating: 4.7,
      since: "March 2025",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
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
        label: "Due soon",
        items: [
          { title: "EPC Certificate", sub: "Expires in 28 days", right: "28 days" },
          { title: "Smoke & CO alarm check", sub: "Evidence needed · legal requirement", right: "Schedule" },
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
      headline: "Upload the tenancy agreement to start the move-in",
      subline: "Everything else — deposit registration, EPC, gas safety — unlocks the moment the AST is filed. About 2 minutes.",
      cta: "Upload now",
      tone: "warning",
    },
    tenant: {
      initials: "SM",
      name: "Sarah Mitchell",
      rating: 4.9,
      since: "February 2026",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face",
    },
    activity: [
      { title: "Deposit received · £1,450", date: "28 Jan" },
      { title: "Tenant verified", date: "20 Jan" },
      { title: "Sarah's application accepted", date: "18 Jan" },
    ],
    upcoming: [
      {
        label: "Blocking move-in",
        items: [
          { title: "Tenancy Agreement (AST)", sub: "Required before any other pre-move-in task", right: "Required", overdue: true },
        ],
      },
      {
        label: "Once the AST is filed",
        items: [
          { title: "Register deposit with TDP scheme", sub: "Within 30 days of receipt", right: "30 days" },
          { title: "Upload EPC, Gas Safety, EICR", sub: "All required before move-in", right: "Pending" },
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
      headline: "Gas Safety Certificate renewal overdue",
      subline: "Legal requirement. Upload the latest certificate to stay compliant — about 5 minutes.",
      cta: "Review",
    },
    hmoTenants: [
      { initials: "MC", name: "Mia Chen",      rent: 650, since: "Jan 2026", status: "Paid",     avatarBg: "#E1ECF7", avatarFg: "#2E5A8C", avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face", stage: "Active tenancy" },
      { initials: "KA", name: "Kwame Asante",  rent: 620, since: "Feb 2026", status: "Paid",     avatarBg: "#EAF3DE", avatarFg: "#3B6D11", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face", stage: "Active tenancy" },
      { initials: "SR", name: "Sofia Rossi",   rent: 600, since: "Mar 2026", status: "Due soon", avatarBg: "#F7E8DD", avatarFg: "#8C4A1F", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face", stage: "Active tenancy", alert: { text: "Rent due in 3 days · gentle reminder suggested", severity: "warn" } },
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
        label: "Overdue",
        items: [
          { title: "Gas Safety Certificate", sub: "Annual inspection · 4 days overdue", right: "Overdue", overdue: true },
        ],
      },
      {
        label: "This year",
        items: [
          { title: "AST renewal — Mia Chen", sub: "Lease ends 31 Dec 2026", right: "50 days" },
          { title: "Deposit Protection — Kwame", sub: "Re-protection window", right: "130 days" },
        ],
      },
    ],
  },
};

const TABS: TabKey[] = ["Overview", "Tasks", "Vault", "Comms", "Payments", "Reviews"];

export function PropertyOverview({
  property, completed, allVaults, taskUploads, extractedFacts, events, reviews,
  onUploadDoc, onUploadDocDirect, onMarkTaskDone, onUnmarkTaskDone, onSetReminder,
  onFileCommsAttachment, onAddReview, onBack, initialTab,
}: PropertyOverviewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab ?? "Overview");
  // Tasks-tab stage lives on the shell so Prev/Next selections persist
  // when the landlord switches tabs and comes back.
  const [taskStage, setTaskStage] = useState<StageName>(() => naturalStage(property));
  const baseData = DATA_BY_ID[property.id] ?? DATA_BY_ID.p2;
  const name = property.address.split(",")[0];

  // A "Just now" timestamp means the landlord just re-uploaded the cert.
  // For p3 (which now carries the expired gas safety), treat that as the
  // renewal and flip the hero + upcoming to a clean state.
  const vault = allVaults[property.id] ?? [];
  const gasSafetyRenewed =
    property.id === "p3" &&
    vault.some(
      (d) =>
        d.name === "Gas Safety Certificate" &&
        d.status === "uploaded" &&
        d.timestamp === "Just now",
    );

  // For p1, the property opens with no tenancy agreement on file. Once the
  // landlord uploads it via the task (or vault), the banner disappears and
  // the hero relaxes into a post-upload "nice work" state until the next
  // real blocker surfaces.
  const contractFiled = vault.some(
    (d) => d.name === "Tenancy Agreement (AST)" && d.status === "uploaded",
  );
  const contractJustFiled = vault.some(
    (d) =>
      d.name === "Tenancy Agreement (AST)" &&
      d.status === "uploaded" &&
      d.timestamp === "Just now",
  );
  const showContractBanner = property.id === "p1" && !contractFiled;

  const data: OverviewData =
    gasSafetyRenewed
      ? {
          ...baseData,
          hero: {
            headline: "All compliant — Gas Safety Certificate renewed",
            subline: "Nice work. We'll nudge you before the next one's due.",
            cta: "View tasks",
            tone: "neutral",
          },
          upcoming: [
            {
              label: "This year",
              items: [
                { title: "AST renewal — Mia Chen", sub: "Lease ends 31 Dec 2026", right: "50 days" },
                { title: "Deposit Protection — Kwame", sub: "Re-protection window", right: "130 days" },
              ],
            },
          ],
        }
      : property.id === "p1" && contractJustFiled
        ? {
            ...baseData,
            hero: {
              headline: "Tenancy agreement filed — key facts extracted",
              subline: `${baseData.tenant?.name ?? "Your tenant"} is now set up. Deposit registration and safety docs are unlocked.`,
              cta: "Continue setup",
              tone: "neutral",
            },
          }
        : baseData;

  // Live derived state from the store
  const currentPhase: LifecyclePhase = getLifecyclePhase(property, completed, allVaults);
  const phaseProgress = getPhaseProgress(property, completed, allVaults);
  const liveEvents = events.filter(e => e.propId === property.id);
  

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
        <div className="flex items-center gap-2">
          <h1 className="text-[20px] font-medium text-foreground tracking-tight">{name}</h1>
          {data.isHmo && (
            <span
              className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "#F1EFFB",
                color: "#534AB7",
                border: "0.5px solid #534AB733",
                fontWeight: 500,
                letterSpacing: "0.5px",
              }}
            >
              HMO
            </span>
          )}
        </div>
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

      {activeTab === "Tasks" ? (
        <LifecycleTasksTab
          property={property}
          completed={completed}
          allVaults={allVaults}
          taskUploads={taskUploads}
          extractedFacts={extractedFacts}
          stage={taskStage}
          onStageChange={setTaskStage}
          onUploadDoc={onUploadDoc}
          onMarkTaskDone={onMarkTaskDone}
          onUnmarkTaskDone={onUnmarkTaskDone}
          onSetReminder={onSetReminder}
        />
      ) : activeTab === "Vault" ? (
        <LifecycleVaultTab
          property={property}
          allVaults={allVaults}
          extractedFacts={extractedFacts}
          onUploadDocDirect={onUploadDocDirect}
        />
      ) : activeTab === "Comms" ? (
        <CommsTab property={property} onFileCommsAttachment={onFileCommsAttachment} role="landlord" />
      ) : activeTab === "Payments" ? (
        <PaymentsTab property={property} />
      ) : activeTab === "Reviews" ? (
        <ReviewsTab property={property} reviews={reviews} onAddReview={onAddReview} role="landlord" propertyScopeId={property.id} />
      ) : (
        <>
          {/* Tenancy-agreement banner — renders whenever the AST hasn't
              been filed yet. Gates the rest of the pre-move-in work by
              driving the landlord straight into the upload task. */}
          {showContractBanner && (() => {
            const BANNER_BG = "#FBF3DE";
            const BANNER_HEAD = "#6B4A12";
            const BANNER_SUB = "#8C6A1F";
            const BANNER_CTA = "#6B4A12";
            return (
              <div
                className="rounded-xl flex items-center justify-between gap-4"
                style={{ backgroundColor: BANNER_BG, padding: "1rem 1.25rem" }}
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-medium" style={{ color: BANNER_HEAD }}>
                    You haven't uploaded the tenancy agreement
                  </p>
                  <p className="text-[13px] mt-1" style={{ color: BANNER_SUB }}>
                    Upload now to unlock the pre-move-in tasks — HomeBound extracts the key dates so deposit, EPC and gas safety all anchor correctly.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("Tasks")}
                  className="shrink-0 text-[13px] font-medium text-white"
                  style={{ backgroundColor: BANNER_CTA, borderRadius: "8px", padding: "8px 16px" }}
                >
                  Upload now
                </button>
              </div>
            );
          })()}

          {/* Missed-payment nudge — sits above the hero so it's the first
              thing the landlord sees. Only renders when PAYMENTS_BY_PROP
              records at least one missed month for this property. */}
          {(() => {
            const missed = (PAYMENTS_BY_PROP[property.id] || []).filter(pm => pm.status === "missed");
            if (missed.length === 0) return null;
            const label = missed.length === 1
              ? `Missed payment — ${missed[0].date}`
              : `${missed.length} missed payments`;
            const sub = "No rent received for this period. Send a nudge to open a conversation with the tenant.";
            return (
              <div
                className="rounded-xl flex items-center justify-between gap-4"
                style={{ backgroundColor: RED_BG, padding: "1rem 1.25rem" }}
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-medium" style={{ color: RED_DARK }}>
                    {label}
                  </p>
                  <p className="text-[13px] mt-1" style={{ color: RED_MID }}>
                    {sub}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("Comms")}
                  className="shrink-0 text-[13px] font-medium text-white"
                  style={{ backgroundColor: RED_DARK, borderRadius: "8px", padding: "8px 16px" }}
                >
                  Send nudge
                </button>
              </div>
            );
          })()}

          {/* Hero action card — suppressed when the tenancy-agreement
              banner is active, since both would be saying the same thing. */}
          {!showContractBanner && (() => {
            const tone = data.hero.tone;
            const isWarning = tone === "warning";
            const isNeutral = tone === "neutral";
            const bg = isWarning ? "#FBF3DE" : isNeutral ? "#F2F4F0" : RED_BG;
            const headColor = isWarning ? "#6B4A12" : isNeutral ? "#1F5A3A" : RED_DARK;
            const subColor = isWarning ? "#8C6A1F" : isNeutral ? "#3A7355" : RED_MID;
            const btnBg = isWarning ? "#6B4A12" : isNeutral ? "#1F5A3A" : RED_DARK;
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
                  onClick={() => {
                    // For a danger/warning hero, the CTA sends the landlord
                    // into the Vault tab so they can upload the missing doc.
                    // Neutral heroes take them to Tasks for a gentler nudge.
                    if (tone === "neutral") {
                      setActiveTab("Tasks");
                    } else {
                      setActiveTab("Vault");
                    }
                  }}
                  className="shrink-0 text-[13px] font-medium text-white"
                  style={{ backgroundColor: btnBg, borderRadius: "8px", padding: "8px 16px" }}
                >
                  {data.hero.cta}
                </button>
              </div>
            );
          })()}

          {/* Lifecycle tracker — derived from real completion state */}
          {(() => {
            const phaseLabels: Record<LifecyclePhase, string> = {
              "Pre-Move-In": "Pre-move-in",
              "Move-In": "Move-in",
              "During Tenancy": "Active tenancy",
              "Move-Out": "Move-out",
            };
            const phaseOrder: LifecyclePhase[] = ["Pre-Move-In", "Move-In", "During Tenancy", "Move-Out"];
            const stages = phaseOrder.map(ph => {
              const p = phaseProgress[ph];
              const active = ph === currentPhase;
              const count = p.open === 0
                ? "all done"
                : `${p.open} ${p.open === 1 ? "task" : "tasks"} open`;
              return { name: phaseLabels[ph], count, active };
            });
            const totalOpen = phaseOrder.reduce((sum, ph) => sum + phaseProgress[ph].open, 0);
            const summary = totalOpen === 0
              ? "All caught up"
              : `${totalOpen} open · ${phaseLabels[currentPhase]} stage`;
            const allCaughtUp = totalOpen === 0;

            // First open task in the currently-active phase. Drives the
            // "Next up" label and the Mark-done button below.
            const phaseTasks = (TASK_DATA.landlord[currentPhase] ?? []).filter(
              (t) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || property.isHmo),
            );
            const propVault = allVaults[property.id] ?? [];
            const nextOpenTask = phaseTasks.find((t) => {
              const docUploaded =
                !!t.vaultDoc &&
                propVault.some((d) => d.name === t.vaultDoc && d.status === "uploaded");
              return !completed[`${property.id}_${t.id}`] && !docUploaded;
            });
            const nextUp = allCaughtUp
              ? "All caught up"
              : nextOpenTask?.label ?? data.hero.headline;
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
                    {!allCaughtUp && nextOpenTask && (
                      <button
                        onClick={() => {
                          onMarkTaskDone(property.id, nextOpenTask.id, nextOpenTask.label);
                        }}
                        className="text-[13px] text-foreground hairline rounded-lg"
                        style={{ padding: "6px 14px" }}
                      >
                        Mark done
                      </button>
                    )}
                    <button
                      onClick={() => {
                        // Jump to the Tasks tab. If we can map the current
                        // lifecycle phase to a Tasks-tab stage, open that
                        // stage directly so the landlord lands on the right
                        // list.
                        const phaseToStage: Record<LifecyclePhase, StageName> = {
                          "Pre-Move-In": "Pre-move-in",
                          "Move-In": "Move-in",
                          "During Tenancy": "Active tenancy",
                          "Move-Out": "Move-out",
                        };
                        setTaskStage(phaseToStage[currentPhase]);
                        setActiveTab("Tasks");
                      }}
                      className="text-[13px] text-muted-foreground hairline rounded-lg"
                      style={{ padding: "6px 10px" }}
                    >
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
                        {t.avatarUrl ? (
                          <img
                            src={t.avatarUrl}
                            alt={t.name}
                            className="rounded-full object-cover shrink-0"
                            style={{ width: "40px", height: "40px" }}
                          />
                        ) : (
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
                        )}
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
                    {data.tenant.avatarUrl ? (
                      <img
                        src={data.tenant.avatarUrl}
                        alt={data.tenant.name}
                        className="rounded-full object-cover shrink-0"
                        style={{ width: "44px", height: "44px" }}
                      />
                    ) : (
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
                    )}
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
                    {[
                      ...liveEvents.map(e => ({ title: e.title, date: e.date })),
                      ...data.activity,
                    ].slice(0, 6).map((a, i) => (
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
