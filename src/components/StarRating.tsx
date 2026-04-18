import { Star } from "lucide-react";

export function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5 text-muted-foreground">
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = rating >= s;
        const half = !filled && rating >= s - 0.5;
        return (
          <div key={s} className="relative" style={{ width: size, height: size }}>
            <Star size={size} strokeWidth={1.5} fill={filled ? "currentColor" : "none"} />
            {half && (
              <div className="absolute inset-0 overflow-hidden w-1/2">
                <Star size={size} strokeWidth={1.5} fill="currentColor" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
