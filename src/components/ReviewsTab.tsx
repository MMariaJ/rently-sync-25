// Personal Reviews surface — two-zone layout.
//
// Zone 1 — "Your rating as a [role]": aggregate, dimension breakdown, and
// the list of reviews the user has *received*. Landlord also gets a
// per-property breakdown card.
//
// Zone 2 — "Reviews you've given": optional contextual prompt (when there's
// an unreviewed end-of-tenancy or renewal moment), plus the list of reviews
// the user has *authored*.
//
// Role prop drives all copy and dimension shapes — single file covers both
// tenant and landlord. The prop-driven approach mirrors CommsTab.

import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { StarRating } from "./StarRating";
import {
  USERS, PORTFOLIO, PROP_RATINGS,
  LANDLORD_USER_ID, TENANT_USER_ID,
  propertyLabelFor,
  type Review, type UserRole,
  type TenantDimensions, type LandlordDimensions,
  type Property, // kept — ReviewsTabProps surfaces it for callers
} from "@/data/constants";
import {
  mergeReviews, getReviewsFor, getReviewMoment,
  aggregateScore, aggregateTenantDimensions, aggregateLandlordDimensions,
} from "@/data/helpers";
import type { ReviewEntry, AppActions } from "@/state/useAppStore";

const PURPLE = "#534AB7";
const PURPLE_DEEP = "#3C3489";
const PURPLE_DEEPER = "#26215C";
const PURPLE_TINT = "#F7F5FD";
const PURPLE_BORDER = "#CECBF6";
const AMBER = "#F59E0B";
const GREEN_BG = "#EAF3DE";
const GREEN_TEXT = "#27500A";

interface ReviewsTabProps {
  // `property` is no longer read by the tab (surface is person-scoped, not
  // property-scoped) but remains in the signature so PropertyOverview and
  // TenantHome don't have to change their wiring.
  property?: Property;
  reviews?: ReviewEntry[];
  onAddReview?: AppActions["addReview"];
  role?: UserRole;
  // Within-property view: when set, the tab only shows reviews tied to
  // this property (both received and given). Used inside TenantHome /
  // PropertyOverview so the in-tenancy tab reflects just this landlord
  // ↔ tenant pair, while the top-level sidebar page stays unscoped.
  propertyScopeId?: string;
}

export function ReviewsTab({
  reviews = [], onAddReview, role = "landlord", propertyScopeId,
}: ReviewsTabProps) {
  const userId = role === "landlord" ? LANDLORD_USER_ID : TENANT_USER_ID;
  const allReviews = useMemo(() => mergeReviews(reviews), [reviews]);
  const receivedAll = useMemo(() => getReviewsFor(allReviews, userId, "received"), [allReviews, userId]);
  const givenAll = useMemo(() => getReviewsFor(allReviews, userId, "given"), [allReviews, userId]);
  const received = useMemo(
    () => propertyScopeId ? receivedAll.filter(r => r.propertyId === propertyScopeId) : receivedAll,
    [receivedAll, propertyScopeId],
  );
  const given = useMemo(
    () => propertyScopeId ? givenAll.filter(r => r.propertyId === propertyScopeId) : givenAll,
    [givenAll, propertyScopeId],
  );
  const momentRaw = useMemo(() => getReviewMoment(allReviews, userId, role), [allReviews, userId, role]);
  // In a scoped view we only surface the review-moment prompt when the
  // triggering tenancy belongs to the current property — otherwise it's
  // noise from another tenancy.
  const moment = propertyScopeId
    ? (momentRaw && momentRaw.propertyId === propertyScopeId ? momentRaw : null)
    : momentRaw;

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSubject, setComposeSubject] = useState<{
    subjectId: string;
    subjectName: string;
    subjectRole: UserRole;
    propertyId: string;
    tenancyId: string;
  } | null>(null);

  const openCompose = (args: {
    subjectId: string; subjectName: string; subjectRole: UserRole;
    propertyId: string; tenancyId: string;
  }) => {
    setComposeSubject(args);
    setComposeOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ============== ZONE 1 — RECEIVED ============== */}
      <section className="space-y-3">
        <ZoneHeading
          eyebrow={role === "landlord" ? "Your rating as a landlord" : "Your rating as a tenant"}
          subtitle={`Based on ${received.length} ${received.length === 1 ? "review" : "reviews"} from ${role === "landlord" ? "tenants" : "landlords"}.`}
        />

        <AggregateCard reviews={received} role={role} />

        {role === "landlord" && !propertyScopeId && <PerPropertyCard />}

        <ReceivedReviewsCard reviews={received} />
      </section>

      {/* ============== ZONE 2 — GIVEN ============== */}
      <section className="space-y-3">
        <ZoneHeading
          eyebrow="Reviews you've given"
          subtitle={role === "landlord"
            ? "Your reviews of past and current tenants."
            : "Your reviews of past and current landlords."}
        />

        {moment && (
          <ReviewPromptCard
            moment={moment}
            onReview={() => openCompose({
              subjectId: moment.subjectId,
              subjectName: moment.subjectName,
              subjectRole: moment.subjectRole,
              propertyId: moment.propertyId,
              tenancyId: moment.tenancyId,
            })}
          />
        )}

        <GivenReviewsCard reviews={given} />
      </section>

      {composeOpen && composeSubject && onAddReview && (
        <ReviewFormModal
          authorRole={role}
          subject={composeSubject}
          onClose={() => setComposeOpen(false)}
          onSubmit={(payload) => {
            onAddReview({
              authorId: userId,
              authorRole: role,
              subjectId: composeSubject.subjectId,
              subjectRole: composeSubject.subjectRole,
              propertyId: composeSubject.propertyId,
              tenancyId: composeSubject.tenancyId,
              rating: payload.rating,
              body: payload.body,
              tenantDimensions: payload.tenantDimensions,
              landlordDimensions: payload.landlordDimensions,
            });
            setComposeOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function ZoneHeading({ eyebrow, subtitle }: { eyebrow: string; subtitle: string }) {
  return (
    <div>
      <p
        className="text-muted-foreground"
        style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}
      >
        {eyebrow}
      </p>
      <p className="text-[12px] text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

function AggregateCard({ reviews, role }: { reviews: Review[]; role: UserRole }) {
  const score = aggregateScore(reviews);
  const count = reviews.length;

  // "Top N%" pill — deterministic for the prototype. Maps a score into a
  // coarse band (5.0 → top 2%, 4.8+ → top 5%, 4.5+ → top 15%, else 40%).
  const topPct =
    score >= 5 ? 2 :
    score >= 4.8 ? 5 :
    score >= 4.5 ? 15 :
    score >= 4 ? 30 : 40;

  // Dimensions are driven by the *author's* role. Received reviews:
  //   - landlord-viewer → reviews authored by tenants → tenant-of-landlord
  //     dims (responsiveness, maintenance, fairness, communication) — 4 cols.
  //   - tenant-viewer → reviews authored by landlords → landlord-of-tenant
  //     dims (pays on time, communication, care of property) — 3 cols.
  const tenantAuthoredDims = role === "landlord" ? aggregateTenantDimensions(reviews) : null;
  const landlordAuthoredDims = role === "tenant" ? aggregateLandlordDimensions(reviews) : null;

  return (
    <div
      className="bg-card"
      style={{ border: "0.5px solid hsl(var(--border))", borderRadius: "12px", padding: "1.25rem 1.5rem" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-foreground tabular-nums"
            style={{ fontSize: "28px", fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.01em" }}
          >
            {score.toFixed(1)}
          </p>
          <div className="flex items-center" style={{ gap: "8px", marginTop: "8px" }}>
            <StarRating rating={score} size={14} color={AMBER} />
            <span className="text-[12px] text-muted-foreground tabular-nums">
              Based on {count} {count === 1 ? "review" : "reviews"} from {role === "landlord" ? "tenants" : "previous landlords"}
            </span>
          </div>
        </div>
        {count > 0 && (
          <span
            className="text-[11px] tabular-nums shrink-0"
            style={{
              backgroundColor: GREEN_BG,
              color: GREEN_TEXT,
              padding: "3px 10px",
              borderRadius: "8px",
              fontWeight: 500,
            }}
          >
            Top {topPct}% of {role === "landlord" ? "landlords" : "tenants"}
          </span>
        )}
      </div>

      {(tenantAuthoredDims || landlordAuthoredDims) && (
        <div
          className="grid"
          style={{
            gridTemplateColumns: role === "landlord" ? "repeat(4, 1fr)" : "repeat(3, 1fr)",
            gap: "12px",
            marginTop: "18px",
            paddingTop: "16px",
            borderTop: "0.5px solid hsl(var(--border))",
          }}
        >
          {tenantAuthoredDims && (
            <>
              <DimensionCell label="Responsiveness" score={tenantAuthoredDims.responsiveness} />
              <DimensionCell label="Maintenance" score={tenantAuthoredDims.maintenance} />
              <DimensionCell label="Fairness" score={tenantAuthoredDims.fairness} />
              <DimensionCell label="Communication" score={tenantAuthoredDims.communication} />
            </>
          )}
          {landlordAuthoredDims && (
            <>
              <DimensionCell label="Pays on time" score={landlordAuthoredDims.paysOnTime} />
              <DimensionCell label="Communication" score={landlordAuthoredDims.communication} />
              <DimensionCell label="Care of property" score={landlordAuthoredDims.careOfProperty} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DimensionCell({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="flex items-center" style={{ gap: "6px", marginTop: "4px" }}>
        <span className="text-[14px] text-foreground tabular-nums" style={{ fontWeight: 500 }}>
          {score.toFixed(1)}
        </span>
        <StarRating rating={score} size={10} color={AMBER} />
      </div>
    </div>
  );
}

function PerPropertyCard() {
  return (
    <div
      className="bg-card"
      style={{ border: "0.5px solid hsl(var(--border))", borderRadius: "12px", padding: "1rem 1.25rem" }}
    >
      <p
        className="text-muted-foreground"
        style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, marginBottom: "10px" }}
      >
        By property
      </p>
      <div className="flex flex-col" style={{ gap: "8px" }}>
        {PORTFOLIO.map((p) => {
          const r = PROP_RATINGS[p.id];
          return (
            <div key={p.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[13px] text-foreground truncate" style={{ fontWeight: 500 }}>
                  {p.address.split(",")[0]}
                </p>
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  {r?.count ?? 0} {(r?.count ?? 0) === 1 ? "review" : "reviews"}
                </p>
              </div>
              <div className="flex items-center shrink-0" style={{ gap: "6px" }}>
                <StarRating rating={r?.rating ?? 0} size={11} color={AMBER} />
                <span className="text-[13px] text-foreground tabular-nums" style={{ fontWeight: 500 }}>
                  {(r?.rating ?? 0).toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReceivedReviewsCard({ reviews }: { reviews: Review[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? reviews : reviews.slice(0, 3);

  if (reviews.length === 0) {
    return (
      <div
        className="bg-card text-center"
        style={{ border: "0.5px solid hsl(var(--border))", borderRadius: "12px", padding: "2rem 1.5rem" }}
      >
        <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>No reviews yet</p>
        <p className="text-[12px] text-muted-foreground mt-1">
          You'll see reviews here as your tenancies run their course.
        </p>
      </div>
    );
  }

  return (
    <div
      className="bg-card"
      style={{ border: "0.5px solid hsl(var(--border))", borderRadius: "12px", overflow: "hidden" }}
    >
      {visible.map((r, idx) => (
        <ReviewRow key={r.id} review={r} subjectSide="author" separator={idx > 0} />
      ))}
      {reviews.length > 3 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-center hover:bg-secondary/40 transition-colors"
          style={{
            padding: "10px 16px",
            fontSize: "12px",
            color: PURPLE,
            fontWeight: 500,
            borderTop: "0.5px solid hsl(var(--border))",
            background: "none",
            cursor: "pointer",
          }}
        >
          view all ({reviews.length}) →
        </button>
      )}
    </div>
  );
}

function GivenReviewsCard({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div
        className="bg-card text-center"
        style={{ border: "0.5px solid hsl(var(--border))", borderRadius: "12px", padding: "2rem 1.5rem" }}
      >
        <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>You haven't written a review yet</p>
        <p className="text-[12px] text-muted-foreground mt-1">
          Reviews you post will appear here — you'll be prompted when a tenancy ends or renews.
        </p>
      </div>
    );
  }
  return (
    <div
      className="bg-card"
      style={{ border: "0.5px solid hsl(var(--border))", borderRadius: "12px", overflow: "hidden" }}
    >
      {reviews.map((r, idx) => (
        <ReviewRow key={r.id} review={r} subjectSide="subject" separator={idx > 0} showEditDelete />
      ))}
    </div>
  );
}

// One review row. `subjectSide` controls who is named in the row header:
//   "author"  — name the author (received list: "who wrote this about me")
//   "subject" — name the subject (given list: "who I reviewed")
function ReviewRow({
  review: r, subjectSide, separator, showEditDelete,
}: {
  review: Review;
  subjectSide: "author" | "subject";
  separator?: boolean;
  showEditDelete?: boolean;
}) {
  const header = subjectSide === "author" ? USERS[r.authorId] : USERS[r.subjectId];
  const headerRoleLabel = (subjectSide === "author" ? r.authorRole : r.subjectRole) === "landlord"
    ? "Landlord" : "Tenant";
  const propLabel = propertyLabelFor(r.propertyId);

  return (
    <div
      className="px-5 py-4"
      style={separator ? { borderTop: "0.5px solid hsl(var(--border))" } : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start min-w-0" style={{ gap: "12px" }}>
          {header?.avatarUrl && (
            <img
              src={header.avatarUrl}
              alt={header.name}
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center flex-wrap" style={{ gap: "6px" }}>
              <span className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                {header?.name ?? (subjectSide === "author" ? r.authorId : r.subjectId)}
              </span>
              <span className="text-[11px] text-muted-foreground">{headerRoleLabel}</span>
            </div>
            <p className="text-[11px] text-muted-foreground tabular-nums" style={{ marginTop: "2px" }}>
              {propLabel} · {r.dateLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center shrink-0" style={{ gap: "6px" }}>
          <StarRating rating={r.rating} size={12} color={AMBER} />
          <span className="text-[13px] text-foreground tabular-nums" style={{ fontWeight: 500 }}>
            {r.rating.toFixed(1)}
          </span>
        </div>
      </div>

      <p className="text-[13px] text-foreground leading-relaxed" style={{ marginTop: "10px" }}>
        {r.body}
      </p>

      {showEditDelete && (
        <div className="flex items-center" style={{ gap: "14px", marginTop: "10px" }}>
          <button
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Edit
          </button>
          <button
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function ReviewPromptCard({
  moment, onReview,
}: {
  moment: ReturnType<typeof getReviewMoment>;
  onReview: () => void;
}) {
  if (!moment) return null;
  const firstName = moment.subjectName.split(" ")[0];
  const headline =
    moment.triggerReason === "renewal"
      ? "Your tenancy renewed last week — share your experience"
      : moment.subjectRole === "tenant"
        ? `${moment.subjectName} moved out last week — share how the tenancy went`
        : `Your tenancy with ${moment.subjectName} ended recently — share how it went`;

  return (
    <div
      style={{
        backgroundColor: PURPLE_TINT,
        border: `0.5px solid ${PURPLE_BORDER}`,
        borderRadius: "12px",
        padding: "1rem 1.25rem",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            style={{
              fontSize: "11px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 500,
              color: PURPLE_DEEP,
            }}
          >
            Review moment
          </p>
          <p
            className="tracking-tight"
            style={{ fontSize: "14px", color: PURPLE_DEEPER, fontWeight: 500, marginTop: "4px" }}
          >
            {headline}
          </p>
          <p style={{ fontSize: "12px", color: PURPLE_DEEP, marginTop: "4px" }}>
            About 2 minutes · your review feeds into {moment.subjectRole === "tenant" ? "tenant verification ✓" : "landlord trust scores"}.
          </p>
        </div>
        <button
          onClick={onReview}
          className="shrink-0"
          style={{
            backgroundColor: PURPLE,
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: 500,
            borderRadius: "8px",
            padding: "8px 14px",
            border: "none",
            whiteSpace: "nowrap",
            cursor: "pointer",
          }}
        >
          Review {firstName}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review form modal
// ---------------------------------------------------------------------------

interface ReviewFormPayload {
  rating: number;
  body: string;
  tenantDimensions?: TenantDimensions;
  landlordDimensions?: LandlordDimensions;
}

function ReviewFormModal({
  authorRole, subject, onClose, onSubmit,
}: {
  authorRole: UserRole;
  subject: { subjectId: string; subjectName: string; subjectRole: UserRole; propertyId: string; tenancyId: string };
  onClose: () => void;
  onSubmit: (v: ReviewFormPayload) => void;
}) {
  const [overall, setOverall] = useState(5);
  const [overallHover, setOverallHover] = useState(0);
  const [body, setBody] = useState("");

  // Tenant reviewing landlord → tenantDimensions; vice versa → landlordDims.
  const useTenantDims = authorRole === "tenant";
  const [tDims, setTDims] = useState<TenantDimensions>({ responsiveness: 5, maintenance: 5, fairness: 5, communication: 5 });
  const [lDims, setLDims] = useState<LandlordDimensions>({ paysOnTime: 5, communication: 5, careOfProperty: 5 });

  const overallDisplay = overallHover || overall;
  const firstName = subject.subjectName.split(" ")[0];

  const canSubmit = body.trim().length > 0 && overall > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card"
        style={{
          border: "0.5px solid hsl(var(--border))",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "520px",
          padding: "1.5rem",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h3 className="text-[16px] text-foreground" style={{ fontWeight: 500 }}>
          Review {subject.subjectName}
        </h3>
        <p className="text-[12px] text-muted-foreground mt-1">
          Reviews feed into {subject.subjectRole === "tenant" ? "tenant verification ✓" : "landlord trust scores"} on both sides.
        </p>

        {/* Overall rating */}
        <div className="rounded-lg" style={{ backgroundColor: PURPLE_TINT, padding: "1rem", marginTop: "1.25rem" }}>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2" style={{ fontWeight: 500 }}>
            Overall
          </p>
          <StarInput value={overall} hover={overallHover} onHover={setOverallHover} onChange={setOverall} />
          <p className="text-[12px] text-muted-foreground" style={{ marginTop: "6px" }}>
            {overallDisplay}.0 out of 5
          </p>
        </div>

        {/* Per-dimension */}
        <div style={{ marginTop: "1rem", display: "grid", gap: "10px" }}>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground" style={{ fontWeight: 500 }}>
            Rate each area
          </p>
          {useTenantDims ? (
            <>
              <DimensionInput label="Responsiveness" value={tDims.responsiveness} onChange={v => setTDims(d => ({ ...d, responsiveness: v }))} />
              <DimensionInput label="Maintenance" value={tDims.maintenance} onChange={v => setTDims(d => ({ ...d, maintenance: v }))} />
              <DimensionInput label="Fairness" value={tDims.fairness} onChange={v => setTDims(d => ({ ...d, fairness: v }))} />
              <DimensionInput label="Communication" value={tDims.communication} onChange={v => setTDims(d => ({ ...d, communication: v }))} />
            </>
          ) : (
            <>
              <DimensionInput label="Pays on time" value={lDims.paysOnTime} onChange={v => setLDims(d => ({ ...d, paysOnTime: v }))} />
              <DimensionInput label="Communication" value={lDims.communication} onChange={v => setLDims(d => ({ ...d, communication: v }))} />
              <DimensionInput label="Care of property" value={lDims.careOfProperty} onChange={v => setLDims(d => ({ ...d, careOfProperty: v }))} />
            </>
          )}
        </div>

        {/* Body */}
        <div style={{ marginTop: "1rem" }}>
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 block" style={{ fontWeight: 500 }}>
            Your review
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`How has ${firstName} been as a ${subject.subjectRole}?`}
            rows={4}
            className="w-full bg-secondary rounded-lg px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:bg-background resize-none"
            style={{ border: "0.5px solid hsl(var(--border))" }}
          />
        </div>

        <div className="flex" style={{ gap: "8px", marginTop: "1.25rem" }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-secondary text-foreground text-[13px] hover:bg-secondary/70 transition-colors"
            style={{ fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit({
              rating: overall,
              body: body.trim(),
              tenantDimensions: useTenantDims ? tDims : undefined,
              landlordDimensions: useTenantDims ? undefined : lDims,
            })}
            disabled={!canSubmit}
            className="flex-1 py-2.5 rounded-lg text-[13px] text-white disabled:opacity-40"
            style={{ backgroundColor: PURPLE, fontWeight: 500 }}
          >
            Post review
          </button>
        </div>
      </div>
    </div>
  );
}

function StarInput({
  value, hover, onHover, onChange,
}: {
  value: number;
  hover: number;
  onHover: (v: number) => void;
  onChange: (v: number) => void;
}) {
  const display = hover || value;
  return (
    <div className="flex items-center" style={{ gap: "4px" }}>
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = display >= s;
        return (
          <button
            key={s}
            type="button"
            onMouseEnter={() => onHover(s)}
            onMouseLeave={() => onHover(0)}
            onClick={() => onChange(s)}
            aria-label={`${s} star${s > 1 ? "s" : ""}`}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <Star
              size={26}
              strokeWidth={1.5}
              fill={filled ? AMBER : "none"}
              color={filled ? AMBER : "hsl(var(--muted-foreground))"}
            />
          </button>
        );
      })}
    </div>
  );
}

function DimensionInput({
  label, value, onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className="flex items-center justify-between" style={{ gap: "12px" }}>
      <span className="text-[12px] text-foreground">{label}</span>
      <div className="flex items-center" style={{ gap: "2px" }}>
        {[1, 2, 3, 4, 5].map((s) => {
          const filled = display >= s;
          return (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onChange(s)}
              aria-label={`${label}: ${s}`}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              <Star
                size={16}
                strokeWidth={1.5}
                fill={filled ? AMBER : "none"}
                color={filled ? AMBER : "hsl(var(--muted-foreground))"}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
