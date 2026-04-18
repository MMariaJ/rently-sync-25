import { Star } from "lucide-react";

interface HeroHealthyCardProps {
  itemsOnTrack: number;
  nextDeadlineDays: number;
  rating: number;
  reviewCount: number;
}

export function HeroHealthyCard({
  itemsOnTrack,
  nextDeadlineDays,
  rating,
  reviewCount,
}: HeroHealthyCardProps) {
  return (
    <div
      className="w-full flex items-center rounded-xl p-5"
      style={{ backgroundColor: "hsl(150 45% 35% / 0.08)" }}
    >
      {/* LEFT — avatar */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
        style={{
          backgroundColor: "hsl(150 45% 35% / 0.15)",
          color: "hsl(150 45% 22%)",
        }}
      >
        <span className="text-[14px] font-medium tracking-tight">DC</span>
      </div>

      {/* MIDDLE */}
      <div className="flex-1 min-w-0 px-4">
        <p
          className="text-[16px] font-medium tracking-tight truncate"
          style={{ color: "hsl(150 45% 22%)" }}
        >
          Everything's sorted, David {"\u2726"}
        </p>
        <p
          className="text-[13px] mt-0.5 truncate"
          style={{ color: "hsl(150 35% 35%)" }}
        >
          All {itemsOnTrack} compliance items on track · Next deadline in {nextDeadlineDays} days
        </p>
      </div>

      {/* DIVIDER */}
      <div
        className="self-stretch mx-3"
        style={{
          width: "0.5px",
          backgroundColor: "hsl(150 30% 35% / 0.25)",
        }}
      />

      {/* RIGHT — rating */}
      <div className="flex flex-col items-end shrink-0">
        <span className="text-[12px]" style={{ color: "hsl(150 30% 38%)" }}>
          Your rating
        </span>
        <div className="flex items-center gap-1 mt-0.5">
          <span
            className="text-[18px] font-medium tabular-nums leading-none"
            style={{ color: "hsl(150 45% 22%)" }}
          >
            {rating.toFixed(1)}
          </span>
          <Star
            size={14}
            strokeWidth={1.5}
            className="text-warning"
            fill="currentColor"
          />
        </div>
        <span className="text-[11px] mt-0.5" style={{ color: "hsl(150 30% 42%)" }}>
          {reviewCount} tenant reviews
        </span>
      </div>
    </div>
  );
}
