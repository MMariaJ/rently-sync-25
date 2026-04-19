// Tenant Dashboard — single-page tenant shell.
//
// Because a tenant has one property, the tenancy tabs live directly on the
// home page rather than behind a "click into the property" step. The header
// (stage label + greeting + sub-line) is persistent; tab-specific content
// renders below.
//
// Tabs: Overview · Tasks · Vault · Comms · Payments · Reviews — same vocab
// as the landlord property view so the two sides of the product share one
// shape. All content reads from the shared data layer.

import { useState } from "react";
import {
  type Property, type VaultDoc, type TenancyPhase,
  TENANT_INFO, LANDLORD_PROFILE,
} from "@/data/constants";
import type { AppActions, ReviewEntry } from "@/state/useAppStore";
import type { ExtractedFacts } from "@/state/engines";
import {
  getTenantPhase,
  buildTenantHero, getMoveInProgress, getSafetyStatus,
  getTenantDeadlines, getTenantClosingNote,
} from "@/state/tenantEngine";
import { TenantTasksTab, defaultTenantStage } from "./TenantTasksTab";
import { TenantVaultTab } from "./TenantVaultTab";
import { CommsTab } from "./CommsTab";
import { PaymentsTab } from "./PaymentsTab";
import { ReviewsTab } from "./ReviewsTab";

const PURPLE = "#534AB7";
const AMBER_TEXT = "#854F0B";
const AMBER_BG = "#FAEEDA";
const GREEN_TEXT = "#27500A";
const GREEN_BG = "#EAF3DE";
const RED_TEXT = "#A32D2D";
const RED_BG = "#FCEBEB";
const SEG_DONE = "#3B6D11";
const SEG_NEEDS = "#E24B4A";
const SEG_UPCOMING = "#E4E4E7";
const HERO_BG = "#FDF6F5";
const HERO_BORDER = "#F7C1C1";
const HERO_HEAD = "#791F1F";
const HERO_SUB = "#A32D2D";
const AVATAR_BG = "#EEEDFE";
const GROUP_HEAD = "#94A3B8";
const GROUP_BORDER = "#F1F5F9";
const BUTTON_BORDER = "#CBD5E1";

export type TenantTab = "Overview" | "Tasks" | "Vault" | "Comms" | "Payments" | "Reviews";
const TABS: TenantTab[] = ["Overview", "Tasks", "Vault", "Comms", "Payments", "Reviews"];

interface TenantHomeProps {
  property: Property;
  completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>;
  extractedFacts: Record<string, ExtractedFacts>;
  reviews: ReviewEntry[];
  onUploadDocDirect: AppActions["uploadDocDirect"];
  onMarkTaskDone: AppActions["markTaskDone"];
  onUnmarkTaskDone: AppActions["unmarkTaskDone"];
  onSetReminder: AppActions["setReminder"];
  onFileCommsAttachment: AppActions["fileCommsAttachment"];
  onAddReview: AppActions["addReview"];
  onNudgeLandlord: AppActions["nudgeLandlord"];
}

function initialsFor(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? "")
    .join("");
}

function stageLabel(phase: ReturnType<typeof getTenantPhase>): string {
  switch (phase) {
    case "Pre-Move-In": return "Pre-move-in";
    case "Move-In": return "Move-in";
    case "During Tenancy": return "Active tenancy";
    case "Move-Out": return "Move-out";
    default: return "Active tenancy";
  }
}

export function TenantHome({
  property, completed, allVaults, extractedFacts, reviews,
  onUploadDocDirect, onMarkTaskDone, onUnmarkTaskDone, onSetReminder,
  onFileCommsAttachment, onAddReview, onNudgeLandlord,
}: TenantHomeProps) {
  const [activeTab, setActiveTab] = useState<TenantTab>("Overview");
  // Stage lives on the shell so Prev/Next selections inside the Tasks tab
  // persist when the user leaves and comes back.
  const [taskStage, setTaskStage] = useState<TenancyPhase>(() => defaultTenantStage(property.id));

  const tenant = TENANT_INFO[property.id];
  const progress = getMoveInProgress(property, completed, allVaults);
  const hero = buildTenantHero(property, completed, allVaults);

  const firstName = tenant?.name.split(" ")[0] ?? "there";
  const moveInLabel = property.moveInDate ?? "—";

  // Hero shows the urgent (red) variant only when something actually needs
  // attention within a week (or rent is late). Once the blocking task is
  // cleared, we relax to the neutral greeting — nothing is "urgent" just
  // because we happen to be in a pre-move-in phase.
  const needsYou = progress.needsYou;
  const heroActive = needsYou > 0 || property.paymentStatus === "late";
  const tenantInitials = initialsFor(tenant?.name ?? firstName);
  const greetingLine = needsYou === 0
    ? `Everything is on track for your move-in on ${moveInLabel}.`
    : `${needsYou} ${needsYou === 1 ? "thing" : "things"} to do before you move in on ${moveInLabel}`;

  return (
    <div className="pb-12">
      {/* HERO HEADER — persistent across tabs */}
      <div
        className="flex items-center"
        style={{
          backgroundColor: heroActive ? HERO_BG : GREEN_BG,
          border: heroActive ? `0.5px solid ${HERO_BORDER}` : "0.5px solid #D9E4C6",
          borderRadius: "12px",
          padding: "18px 20px",
          marginBottom: "1.25rem",
          gap: "16px",
        }}
      >
        {tenant?.avatarUrl ? (
          <img
            src={tenant.avatarUrl}
            alt={tenant.name}
            className="object-cover shrink-0"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "9999px",
            }}
          />
        ) : (
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "9999px",
              backgroundColor: heroActive ? "#F7C1C1" : "#CFE0B4",
              color: heroActive ? HERO_HEAD : "#2E5215",
              fontSize: "15px",
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            {tenantInitials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p
            style={{
              fontSize: "16px",
              fontWeight: 500,
              color: heroActive ? HERO_HEAD : "#1F5A3A",
              lineHeight: 1.25,
              marginBottom: "3px",
            }}
          >
            Hi {firstName}{heroActive ? ` — ${hero.headline.toLowerCase()}` : ""}
          </p>
          <p
            style={{
              fontSize: "13px",
              color: heroActive ? HERO_SUB : "#3A7355",
              lineHeight: 1.35,
            }}
          >
            {greetingLine}
          </p>
        </div>

        {heroActive && (
          <button
            onClick={() => setActiveTab("Tasks")}
            className="shrink-0"
            style={{
              backgroundColor: HERO_HEAD,
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 500,
              borderRadius: "8px",
              padding: "8px 16px",
              border: "none",
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            {hero.cta}
          </button>
        )}
      </div>

      {/* TAB BAR */}
      <div
        className="flex items-center hairline-b"
        style={{ gap: "20px", marginBottom: "1.25rem" }}
      >
        {TABS.map(t => {
          const active = t === activeTab;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="relative transition-colors"
              style={{
                paddingBottom: "10px",
                fontSize: "13px",
                color: active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                fontWeight: active ? 500 : 400,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {t}
              {active && (
                <span
                  className="absolute left-0 right-0"
                  style={{
                    bottom: "-1px",
                    height: "2px",
                    backgroundColor: "hsl(var(--foreground))",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      {activeTab === "Overview" ? (
        <OverviewTab
          property={property}
          completed={completed}
          allVaults={allVaults}
          onOpenTasks={() => setActiveTab("Tasks")}
          onOpenComms={() => setActiveTab("Comms")}
          onOpenVault={() => setActiveTab("Vault")}
        />
      ) : activeTab === "Tasks" ? (
        <TenantTasksTab
          property={property}
          completed={completed}
          allVaults={allVaults}
          stage={taskStage}
          onStageChange={setTaskStage}
          onMarkTaskDone={onMarkTaskDone}
          onUnmarkTaskDone={onUnmarkTaskDone}
          onSetReminder={onSetReminder}
          onSwitchToComms={() => setActiveTab("Comms")}
        />
      ) : activeTab === "Vault" ? (
        <TenantVaultTab
          property={property}
          allVaults={allVaults}
          extractedFacts={extractedFacts}
          onSwitchToTasks={() => setActiveTab("Tasks")}
          onNudgeLandlord={onNudgeLandlord}
        />
      ) : activeTab === "Comms" ? (
        <CommsTab property={property} onFileCommsAttachment={onFileCommsAttachment} role="tenant" />
      ) : activeTab === "Payments" ? (
        <PaymentsTab
          property={property}
          role="tenant"
          completed={completed}
          allVaults={allVaults}
        />
      ) : (
        <ReviewsTab property={property} reviews={reviews} onAddReview={onAddReview} role="tenant" propertyScopeId={property.id} />
      )}
    </div>
  );
}

// ---------- Overview tab (the former dashboard body) ----------

interface OverviewTabProps {
  property: Property;
  completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>;
  onOpenTasks: () => void;
  onOpenComms: () => void;
  onOpenVault: () => void;
}

function OverviewTab({
  property, completed, allVaults, onOpenTasks, onOpenComms, onOpenVault,
}: OverviewTabProps) {
  const phase = getTenantPhase(property, completed, allVaults);
  const moveInProgress = getMoveInProgress(property, completed, allVaults);
  const safety = getSafetyStatus(property);
  const deadlines = getTenantDeadlines(property, completed, allVaults);
  const closing = getTenantClosingNote(moveInProgress);

  const addressLine = property.address.split(",")[0];
  const moveInLabel = property.moveInDate ?? "—";

  const deposit = property.depositAmount ?? property.rent;
  const paymentLate = property.paymentStatus === "late";
  const pillText = paymentLate ? "1 late" : "On track";
  const pillTextColor = paymentLate ? RED_TEXT : GREEN_TEXT;
  const pillBg = paymentLate ? RED_BG : GREEN_BG;
  const nextRentLine = paymentLate
    ? `Rent £${property.rent.toLocaleString()} · ${property.daysLate ?? 1} days late`
    : `Next: £${property.rent.toLocaleString()} rent due ${property.dueDate ?? moveInLabel}`;

  type GroupKey = "This week" | "Around move-in";
  const groupOrder: GroupKey[] = ["This week", "Around move-in"];
  const grouped: Record<GroupKey, typeof deadlines> = {
    "This week": deadlines.filter(d => d.group === "This week"),
    "Around move-in": deadlines.filter(d => d.group === "Around move-in"),
  };

  return (
    <>
      {/* TWO-COLUMN HEALTH ROW */}
      <div
        className="grid"
        style={{ gridTemplateColumns: "1.3fr 1fr", gap: "12px", marginBottom: "1rem" }}
      >
        <div
          className="bg-card"
          style={{
            border: "0.5px solid hsl(var(--border))",
            borderRadius: "12px",
            padding: "14px 18px",
          }}
        >
          <div className="flex items-baseline justify-between" style={{ marginBottom: "10px" }}>
            <span
              className="flex items-center"
              style={{ gap: "8px", fontSize: "13px" }}
            >
              <span className="text-muted-foreground">Move-in progress</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: PURPLE,
                  backgroundColor: AVATAR_BG,
                  padding: "1px 8px",
                  borderRadius: "8px",
                }}
              >
                {stageLabel(phase)}
              </span>
            </span>
            <span
              className="text-foreground tabular-nums"
              style={{ fontSize: "13px", fontWeight: 500 }}
            >
              {moveInProgress.done} of {moveInProgress.total} tasks done
            </span>
          </div>

          <div className="flex" style={{ gap: "3px", height: "8px" }}>
            {moveInProgress.done > 0 && (
              <div style={{ flex: moveInProgress.done, backgroundColor: SEG_DONE, borderRadius: "4px" }} />
            )}
            {moveInProgress.needsYou > 0 && (
              <div style={{ flex: moveInProgress.needsYou, backgroundColor: SEG_NEEDS, borderRadius: "4px" }} />
            )}
            {moveInProgress.upcoming > 0 && (
              <div style={{ flex: moveInProgress.upcoming, backgroundColor: SEG_UPCOMING, borderRadius: "4px" }} />
            )}
          </div>

          <div className="flex items-center" style={{ marginTop: "10px", gap: "6px", fontSize: "12px" }}>
            <span>
              <span className="text-foreground tabular-nums">{moveInProgress.done}</span>{" "}
              <span className="text-muted-foreground">done</span>
            </span>
            <span className="text-muted-foreground">·</span>
            <span>
              <span className="text-foreground tabular-nums">{moveInProgress.needsYou}</span>{" "}
              <span className="text-muted-foreground">needs you</span>
            </span>
            <span className="text-muted-foreground">·</span>
            <span>
              <span className="text-foreground tabular-nums">{moveInProgress.upcoming}</span>{" "}
              <span className="text-muted-foreground">upcoming</span>
            </span>
          </div>
        </div>

        <div
          className="bg-card"
          style={{
            border: "0.5px solid hsl(var(--border))",
            borderRadius: "12px",
            padding: "14px 18px",
          }}
        >
          <div className="flex items-baseline justify-between" style={{ marginBottom: "10px" }}>
            <span className="text-muted-foreground" style={{ fontSize: "13px" }}>
              Your payments
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: pillTextColor,
                backgroundColor: pillBg,
                padding: "2px 8px",
                borderRadius: "8px",
              }}
            >
              {pillText}
            </span>
          </div>

          <div className="flex items-baseline" style={{ gap: "6px", marginBottom: "4px" }}>
            <span
              className="text-foreground tabular-nums"
              style={{ fontSize: "20px", fontWeight: 500, lineHeight: 1 }}
            >
              £{deposit.toLocaleString()}
            </span>
            <span className="text-muted-foreground" style={{ fontSize: "12px" }}>
              deposit held
            </span>
          </div>

          <p className="text-muted-foreground tabular-nums" style={{ fontSize: "12px" }}>
            {nextRentLine}
          </p>
        </div>
      </div>

      {/* TWO-COLUMN BODY */}
      <div
        className="grid"
        style={{ gridTemplateColumns: "1.3fr 1fr", gap: "12px" }}
      >
        <div className="flex flex-col" style={{ gap: "12px" }}>
          <section>
            <h2
              className="text-muted-foreground"
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Your home
            </h2>
            <button
              onClick={onOpenVault}
              className="bg-card w-full text-left"
              style={{
                border: "0.5px solid hsl(var(--border))",
                borderRadius: "12px",
                padding: "14px 16px",
                cursor: "pointer",
              }}
            >
              <div className="flex items-start justify-between" style={{ marginBottom: "10px" }}>
                <div className="min-w-0">
                  <p className="text-foreground truncate" style={{ fontSize: "14px", fontWeight: 500 }}>
                    {addressLine}
                  </p>
                  <p className="text-muted-foreground" style={{ fontSize: "12px", marginTop: "2px" }}>
                    {property.postcode} · move in {moveInLabel}
                  </p>
                </div>
                <span className="text-muted-foreground shrink-0" style={{ fontSize: "12px" }}>
                  Open →
                </span>
              </div>

              <div
                className="flex items-center justify-between"
                style={{
                  borderTop: "0.5px solid hsl(var(--border))",
                  paddingTop: "10px",
                  fontSize: "12px",
                }}
              >
                <span>
                  <span className="text-muted-foreground">Safety checks </span>
                  <span className="text-foreground" style={{ fontWeight: 500 }}>
                    {safety === "all-current" ? (
                      <>
                        all current <span style={{ color: PURPLE }}>✦</span>
                      </>
                    ) : (
                      "action needed"
                    )}
                  </span>
                </span>
                <span>
                  <span className="text-muted-foreground">Inventory </span>
                  <span className="text-foreground" style={{ fontWeight: 500 }}>
                    awaiting you
                  </span>
                </span>
              </div>
            </button>
          </section>

          <section>
            <h2
              className="text-muted-foreground"
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Your landlord
            </h2>
            <div
              className="bg-card flex items-center justify-between"
              style={{
                border: "0.5px solid hsl(var(--border))",
                borderRadius: "12px",
                padding: "14px 16px",
              }}
            >
              <div className="flex items-center" style={{ gap: "12px" }}>
                {LANDLORD_PROFILE.avatarUrl ? (
                  <img
                    src={LANDLORD_PROFILE.avatarUrl}
                    alt={LANDLORD_PROFILE.name}
                    className="object-cover shrink-0"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "9999px",
                    }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "9999px",
                      backgroundColor: AVATAR_BG,
                      color: PURPLE,
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    {initialsFor(LANDLORD_PROFILE.name)}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center" style={{ gap: "6px" }}>
                    <p className="text-foreground truncate" style={{ fontSize: "14px", fontWeight: 500 }}>
                      {LANDLORD_PROFILE.name}
                    </p>
                    {LANDLORD_PROFILE.verified && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: GREEN_TEXT,
                          backgroundColor: GREEN_BG,
                          padding: "1px 6px",
                          borderRadius: "6px",
                        }}
                      >
                        verified
                      </span>
                    )}
                  </div>
                  <p
                    className="text-muted-foreground tabular-nums"
                    style={{ fontSize: "12px", marginTop: "2px" }}
                  >
                    {LANDLORD_PROFILE.rating.toFixed(1)} ★ · {LANDLORD_PROFILE.reviewCount} reviews · usually replies in {LANDLORD_PROFILE.responseTime ?? "2h"}
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenComms}
                className="shrink-0"
                style={{
                  backgroundColor: "#FFFFFF",
                  color: "hsl(var(--foreground))",
                  border: `0.5px solid ${BUTTON_BORDER}`,
                  borderRadius: "8px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Message
              </button>
            </div>
          </section>
        </div>

        <div>
          <div className="flex items-baseline justify-between" style={{ marginBottom: "8px" }}>
            <h2
              className="text-muted-foreground"
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              What's coming up
            </h2>
            <button
              onClick={onOpenTasks}
              className="text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontSize: "11px", background: "none", border: "none", cursor: "pointer" }}
            >
              View all →
            </button>
          </div>

          <div
            className="bg-card"
            style={{
              border: "0.5px solid hsl(var(--border))",
              borderRadius: "12px",
              padding: "4px 0",
            }}
          >
            {groupOrder.map((groupKey, gIdx) => {
              const items = grouped[groupKey];
              if (items.length === 0) return null;
              return (
                <div
                  key={groupKey}
                  style={gIdx > 0 ? { borderTop: `0.5px solid ${GROUP_BORDER}` } : undefined}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 500,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: GROUP_HEAD,
                      padding: "10px 16px 4px",
                    }}
                  >
                    {groupKey}
                  </div>

                  {items.map(item => {
                    const imminent = item.days <= 7;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between"
                        style={{ padding: "8px 16px" }}
                      >
                        <div className="min-w-0">
                          <p
                            className="text-foreground truncate"
                            style={{ fontSize: "13px", fontWeight: 500 }}
                          >
                            {item.title}
                          </p>
                          <p
                            className="text-muted-foreground truncate"
                            style={{ fontSize: "11px", marginTop: "2px" }}
                          >
                            {item.subtitle}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {imminent ? (
                            <span
                              className="tabular-nums"
                              style={{
                                fontSize: "11px",
                                fontWeight: 500,
                                color: AMBER_TEXT,
                                backgroundColor: AMBER_BG,
                                padding: "3px 8px",
                                borderRadius: "8px",
                              }}
                            >
                              {item.displayLabel}
                            </span>
                          ) : (
                            <span
                              className="text-muted-foreground tabular-nums"
                              style={{ fontSize: "12px" }}
                            >
                              {item.displayLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <p
            className="text-muted-foreground text-center"
            style={{ fontSize: "11px", marginTop: "10px" }}
          >
            {closing}
          </p>
        </div>
      </div>
    </>
  );
}
