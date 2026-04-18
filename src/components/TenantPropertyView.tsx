// Tenant property view — mirror of PropertyOverview from the tenant's side.
//
// Reuses the same skeleton (header row, tab bar, hero, lifecycle tracker,
// upcoming/activity sections) so the visual language is identical. The
// content is tenant-flavoured: "Your landlord", "Your tasks", tenant-side
// hero, tenant phase progression.
//
// Tabs: Overview / Tasks / Vault / Comms / Payments / Reviews — matching
// the landlord page so a tenant feels at home navigating the same product.

import { useState } from "react";
import {
  type Property, TENANT_INFO, LANDLORD_PROFILE, PROP_CONTRACT,
  PROP_RATINGS,
} from "@/data/constants";
import type { ActivityEvent, AppActions, ReviewEntry } from "@/state/useAppStore";
import type { ExtractedFacts, LifecyclePhase } from "@/state/engines";
import {
  getTenantPhase, getTenantPhaseProgress, buildTenantHero,
} from "@/state/tenantEngine";
import { LifecycleVaultTab } from "./LifecycleVaultTab";
import { CommsTab } from "./CommsTab";
import { PaymentsTab } from "./PaymentsTab";
import { ReviewsTab } from "./ReviewsTab";
import { TenantTasksTab } from "./TenantTasksTab";

export interface TenantPropertyViewProps {
  property: Property;
  completed: Record<string, boolean>;
  allVaults: Parameters<typeof LifecycleVaultTab>[0]["allVaults"];
  taskUploads: Record<string, string>;
  extractedFacts: Record<string, ExtractedFacts>;
  events: ActivityEvent[];
  reviews: ReviewEntry[];
  onUploadDocDirect: AppActions["uploadDocDirect"];
  onMarkTaskDone: AppActions["markTaskDone"];
  onUnmarkTaskDone: AppActions["unmarkTaskDone"];
  onSetReminder: AppActions["setReminder"];
  onFileCommsAttachment: AppActions["fileCommsAttachment"];
  onAddReview: AppActions["addReview"];
  onBack: () => void;
}

type TabKey = "Overview" | "Tasks" | "Vault" | "Comms" | "Payments" | "Reviews";
const TABS: TabKey[] = ["Overview", "Tasks", "Vault", "Comms", "Payments", "Reviews"];

const PURPLE = "#534AB7";
const RED_BG = "#FBECEC";
const RED_DARK = "#791F1F";
const RED_MID = "#A32D2D";

export function TenantPropertyView({
  property, completed, allVaults, extractedFacts, events, reviews,
  onUploadDocDirect, onMarkTaskDone, onUnmarkTaskDone, onSetReminder,
  onFileCommsAttachment, onAddReview, onBack,
}: TenantPropertyViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("Overview");
  const name = property.address.split(",")[0];
  const tenantInfo = TENANT_INFO[property.id];
  const contract = PROP_CONTRACT[property.id];
  const propRating = PROP_RATINGS?.[property.id];

  const phase: LifecyclePhase = getTenantPhase(property, completed, allVaults);
  const phaseProgress = getTenantPhaseProgress(property, completed, allVaults);
  const hero = buildTenantHero(property, completed, allVaults);
  const liveEvents = events.filter(e => e.propId === property.id).slice(0, 5);

  return (
    <div className="space-y-4 pb-12">
      {/* Breadcrumb */}
      <button
        onClick={onBack}
        className="text-[11px] hover:text-foreground transition-colors"
        style={{ color: "hsl(var(--muted-foreground) / 0.7)" }}
      >
        ← Your home
      </button>

      {/* Header row — matches landlord */}
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-[20px] font-medium text-foreground tracking-tight">{name}</h1>
        <div className="flex items-center text-[13px] text-muted-foreground" style={{ gap: "16px" }}>
          <span>{property.postcode}</span>
          {propRating && (
            <span className="tabular-nums">
              {propRating.rating.toFixed(1)} ★ · {propRating.reviewCount} reviews
            </span>
          )}
          <span className="tabular-nums">£{property.rent.toLocaleString()}/mo</span>
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
        <TenantTasksTab
          property={property}
          completed={completed}
          allVaults={allVaults}
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
        <CommsTab property={property} onFileCommsAttachment={onFileCommsAttachment} />
      ) : activeTab === "Payments" ? (
        <PaymentsTab property={property} />
      ) : activeTab === "Reviews" ? (
        <ReviewsTab property={property} reviews={reviews} onAddReview={onAddReview} />
      ) : (
        <>
          {/* Hero — same shape as landlord overview */}
          {(() => {
            const danger = hero.tone !== "neutral" && property.paymentStatus === "late";
            const neutral = hero.tone === "neutral";
            const bg = danger ? RED_BG : neutral ? "#F2F4F0" : RED_BG;
            const headColor = danger ? RED_DARK : neutral ? "#1F5A3A" : RED_DARK;
            const subColor = danger ? RED_MID : neutral ? "#3A7355" : RED_MID;
            const btnBg = danger ? RED_DARK : neutral ? "#1F5A3A" : RED_DARK;
            return (
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
                  className="shrink-0 text-[13px] font-medium text-white"
                  style={{ backgroundColor: btnBg, borderRadius: "8px", padding: "8px 16px" }}
                >
                  {hero.cta}
                </button>
              </div>
            );
          })()}

          {/* Lifecycle tracker — tenant phase progress */}
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
              const active = ph === phase;
              const count = p.open === 0
                ? "all done"
                : `${p.open} ${p.open === 1 ? "task" : "tasks"} open`;
              return { name: phaseLabels[ph], count, active };
            });
            const totalOpen = phaseOrder.reduce((sum, ph) => sum + phaseProgress[ph].open, 0);
            const summary = totalOpen === 0
              ? "All caught up"
              : `${totalOpen} open · ${phaseLabels[phase]} stage`;
            return (
              <div className="bg-card hairline rounded-xl" style={{ padding: "1.25rem" }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[13px] text-muted-foreground">Your tenancy lifecycle</span>
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
                    <p className="text-[14px] font-medium text-foreground mt-0.5">{hero.headline}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("Tasks")}
                    className="text-[13px] text-muted-foreground hairline rounded-lg shrink-0"
                    style={{ padding: "6px 10px" }}
                  >
                    See all tasks →
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Your landlord card — analogue of "Your tenant" on landlord overview */}
          <section>
            <h2
              className="font-medium text-muted-foreground"
              style={{
                fontSize: "12px", letterSpacing: "0.5px", textTransform: "uppercase",
                marginBottom: "10px",
              }}
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
                  {LANDLORD_PROFILE.rating.toFixed(1)} ★ · {LANDLORD_PROFILE.reviewCount} reviews · since {LANDLORD_PROFILE.memberSince}
                </p>
              </div>
              <button
                onClick={() => setActiveTab("Comms")}
                className="text-[13px] text-foreground hairline rounded-lg shrink-0"
                style={{ padding: "6px 14px" }}
              >
                Message
              </button>
            </div>
          </section>

          {/* Two-column: Activity + Your tenancy */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <section>
              <h2
                className="font-medium text-muted-foreground"
                style={{
                  fontSize: "12px", letterSpacing: "0.5px", textTransform: "uppercase",
                  marginBottom: "10px",
                }}
              >
                Recent activity
              </h2>
              <div className="bg-card hairline rounded-xl overflow-hidden">
                {liveEvents.length === 0 ? (
                  <div className="px-4 py-3 text-[13px] text-muted-foreground">
                    Nothing new yet. New uploads, payments and messages will appear here.
                  </div>
                ) : (
                  liveEvents.map((e, i) => (
                    <div
                      key={e.id}
                      className={`px-4 py-3 flex items-baseline justify-between gap-3 ${i > 0 ? "hairline-t" : ""}`}
                    >
                      <span className="text-[13px] text-foreground truncate">{e.title}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                        {e.date}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <h2
                className="font-medium text-muted-foreground"
                style={{
                  fontSize: "12px", letterSpacing: "0.5px", textTransform: "uppercase",
                  marginBottom: "10px",
                }}
              >
                Your tenancy
              </h2>
              <div className="bg-card hairline rounded-xl" style={{ padding: "14px 16px" }}>
                <Row label="Type" value={contract?.type ?? "—"} />
                <Row label="Term" value={contract ? `${contract.start} → ${contract.end}` : "—"} />
                <Row label="Notice" value={contract?.notice ?? "—"} />
                <Row label="Rent" value={`£${property.rent.toLocaleString()} / month`} />
                <Row
                  label="Deposit"
                  value={
                    property.depositAmount
                      ? `£${property.depositAmount.toLocaleString()} · ${property.depositScheme ?? "—"}`
                      : "—"
                  }
                  last
                />
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 ${last ? "" : "pb-2 mb-2"}`}
      style={last ? undefined : { borderBottom: "0.5px solid hsl(var(--border))" }}
    >
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="text-[13px] text-foreground tabular-nums text-right">{value}</span>
    </div>
  );
}
