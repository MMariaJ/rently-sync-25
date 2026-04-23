import { LANDLORD_PROFILE } from "@/data/constants";

export type HeroState = "healthy" | "compliance" | "late";

interface HeroCardProps {
  state: HeroState;
  // healthy
  itemsOnTrack?: number;
  nextDeadlineDays?: number;
  rating?: number;
  reviewCount?: number;
  // problem states
  headline?: string;
  secondary?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export function HeroHealthyCard({
  state,
  itemsOnTrack = 0,
  nextDeadlineDays = 0,
  rating = 4.7,
  reviewCount = 14,
  headline,
  secondary,
  ctaLabel,
  onCtaClick,
}: HeroCardProps) {
  const isHealthy = state === "healthy";

  // Tints
  const bg = isHealthy ? "#E8F5E9" : "hsl(0 59% 30% / 0.06)";
  const avatarBg = isHealthy
    ? "hsl(140 35% 75% / 0.6)"
    : "hsl(0 59% 30% / 0.12)";
  const ink = isHealthy ? "#1F5A3A" : "hsl(0 59% 24%)";
  const inkSoft = isHealthy ? "#3A7355" : "hsl(0 45% 38%)";

  const defaultHealthyHeadline = `Everything's sorted, David ${"\u2726"}`;
  const defaultHealthySecondary = `All compliance items on track · Next deadline in ${nextDeadlineDays} days`;
  void itemsOnTrack;

  const finalHeadline = headline ?? defaultHealthyHeadline;
  const finalSecondary = secondary ?? defaultHealthySecondary;

  return (
    <div
      className="w-full flex items-center p-6"
      style={{
        backgroundColor: bg,
        borderRadius: "20px",
        boxShadow: "var(--shadow-soft)",
        border: isHealthy ? "0.5px solid hsl(140 35% 80% / 0.6)" : "0.5px solid hsl(0 59% 30% / 0.15)",
      }}
    >
      {/* LEFT — avatar */}
      {LANDLORD_PROFILE.avatarUrl ? (
        <img
          src={LANDLORD_PROFILE.avatarUrl}
          alt={LANDLORD_PROFILE.name}
          className="w-14 h-14 rounded-full object-cover shrink-0"
          style={{ boxShadow: "0 0 0 2px rgba(255,255,255,0.6)" }}
        />
      ) : (
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: avatarBg, color: ink }}
        >
          <span className="text-[15px] font-medium tracking-tight">DC</span>
        </div>
      )}

      {/* MIDDLE */}
      <div className="flex-1 min-w-0 px-5">
        <p
          className="text-[18px] font-medium tracking-tight truncate"
          style={{ color: ink, letterSpacing: "-0.015em" }}
        >
          {finalHeadline}
        </p>
        <p className="text-[13px] mt-1 truncate" style={{ color: inkSoft }}>
          {finalSecondary}
        </p>
      </div>

      {/* RIGHT */}
      {isHealthy ? (
        <>
          <div
            className="self-stretch mx-4"
            style={{ width: "0.5px", backgroundColor: "hsl(150 30% 35% / 0.2)" }}
          />
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[11px]" style={{ color: inkSoft }}>
              Your rating
            </span>
            <div className="flex items-center gap-1 mt-1">
              <span
                className="text-[20px] font-medium tabular-nums leading-none"
                style={{ color: ink, letterSpacing: "-0.02em" }}
              >
                {rating.toFixed(1)}
              </span>
              <span style={{ color: "#0F6E56", fontSize: 15, lineHeight: 1 }}>★</span>
            </div>
            <span className="text-[11px] mt-1" style={{ color: "hsl(150 18% 50%)" }}>
              {reviewCount} tenant reviews
            </span>
          </div>
        </>
      ) : (
        <button
          onClick={onCtaClick}
          className="shrink-0 text-[13px] font-medium rounded-full px-5 py-2.5 transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "hsl(0 59% 30%)",
            color: "hsl(0 0% 100%)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          {ctaLabel ?? "Take action"}
        </button>
      )}
    </div>
  );
}
