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
  const defaultHealthySecondary = `All ${itemsOnTrack} compliance items on track · Next deadline in ${nextDeadlineDays} days`;

  const finalHeadline = headline ?? defaultHealthyHeadline;
  const finalSecondary = secondary ?? defaultHealthySecondary;

  return (
    <div
      className="w-full flex items-center rounded-xl p-5"
      style={{ backgroundColor: bg }}
    >
      {/* LEFT — avatar */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: avatarBg, color: ink }}
      >
        <span className="text-[14px] font-medium tracking-tight">DC</span>
      </div>

      {/* MIDDLE */}
      <div className="flex-1 min-w-0 px-4">
        <p
          className="text-[16px] font-medium tracking-tight truncate"
          style={{ color: ink }}
        >
          {finalHeadline}
        </p>
        <p className="text-[13px] mt-0.5 truncate" style={{ color: inkSoft }}>
          {finalSecondary}
        </p>
      </div>

      {/* RIGHT */}
      {isHealthy ? (
        <>
          <div
            className="self-stretch mx-3"
            style={{ width: "0.5px", backgroundColor: "hsl(150 30% 35% / 0.25)" }}
          />
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[11px]" style={{ color: inkSoft }}>
              Your rating
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className="text-[18px] font-medium tabular-nums leading-none"
                style={{ color: ink }}
              >
                {rating.toFixed(1)}
              </span>
              <span style={{ color: "hsl(35 85% 45%)", fontSize: 14, lineHeight: 1 }}>★</span>
            </div>
            <span className="text-[11px] mt-0.5" style={{ color: "hsl(150 18% 55%)" }}>
              {reviewCount} tenant reviews
            </span>
          </div>
        </>
      ) : (
        <button
          onClick={onCtaClick}
          className="shrink-0 text-[13px] font-medium rounded-lg px-4 py-2 transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "hsl(0 59% 30%)",
            color: "hsl(0 0% 100%)",
          }}
        >
          {ctaLabel ?? "Take action"}
        </button>
      )}
    </div>
  );
}
