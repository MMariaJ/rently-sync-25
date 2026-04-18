// Top-level Reviews page. Landlord sees aggregate ratings across all
// properties; tenant sees their landlord's profile and the reviews on
// their tenancy. Clicking a property card routes to that property's
// Reviews tab.

import { StarRating } from "./StarRating";
import {
  PROP_RATINGS, LANDLORD_PROFILE,
  type Property,
} from "@/data/constants";

const PURPLE = "#534AB7";

interface ReviewsPageProps {
  portfolio: Property[];
  isLandlord: boolean;
  onOpenProperty: (propId: string) => void;
}

export function ReviewsPage({ portfolio, isLandlord, onOpenProperty }: ReviewsPageProps) {
  const ratings = portfolio
    .map((p) => ({ p, r: PROP_RATINGS[p.id] }))
    .filter((x) => x.r);

  const overall = ratings.length
    ? Math.round((ratings.reduce((s, x) => s + x.r.rating, 0) / ratings.length) * 10) / 10
    : 0;
  const totalReviews = ratings.reduce((s, x) => s + (x.r.count ?? 0), 0);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <p
          className="text-[12px] text-muted-foreground"
          style={{ letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 500 }}
        >
          Reviews
        </p>
        <h1 className="text-[24px] font-medium text-foreground tracking-tight mt-1">
          {isLandlord ? "Your reputation" : "Your landlord"}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {isLandlord
            ? "Verified two-way reviews build trust with future tenants."
            : "Reviews and verification details for the person who owns your home."}
        </p>
      </div>

      {/* Hero summary */}
      <div className="bg-card hairline rounded-xl p-8 text-center">
        <p className="text-[40px] tabular-nums text-foreground font-medium tracking-tight">
          {(isLandlord ? overall : LANDLORD_PROFILE.rating).toFixed(1)}
        </p>
        <div className="flex items-center justify-center mt-2 mb-2">
          <StarRating rating={isLandlord ? overall : LANDLORD_PROFILE.rating} size={18} />
        </div>
        <p className="text-[13px] text-muted-foreground">
          {isLandlord
            ? `${totalReviews} reviews across ${portfolio.length} ${portfolio.length === 1 ? "property" : "properties"}`
            : `${LANDLORD_PROFILE.reviewCount} reviews · member since ${LANDLORD_PROFILE.memberSince}`}
        </p>
        {!isLandlord && LANDLORD_PROFILE.verified && (
          <p className="text-[12px] mt-2" style={{ color: PURPLE }}>✓ verified landlord</p>
        )}
      </div>

      {/* Per-property breakdown (landlord) or single card (tenant) */}
      <section>
        <h2
          className="font-medium text-muted-foreground"
          style={{ fontSize: "12px", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "10px" }}
        >
          {isLandlord ? "By property" : "Your tenancy"}
        </h2>
        <div className="bg-card hairline rounded-xl overflow-hidden">
          {portfolio.map((p, idx) => {
            const r = PROP_RATINGS[p.id];
            return (
              <button
                key={p.id}
                onClick={() => onOpenProperty(p.id)}
                className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors"
                style={idx > 0 ? { borderTop: "0.5px solid hsl(var(--border))" } : undefined}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-foreground font-medium truncate">
                    {p.address.split(",")[0]}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{p.postcode}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <StarRating rating={r?.rating ?? 0} size={12} />
                  <span className="text-[13px] tabular-nums text-foreground">
                    {(r?.rating ?? 0).toFixed(1)}
                  </span>
                  <span className="text-[11px] text-muted-foreground ml-1">
                    ({r?.count ?? 0})
                  </span>
                </div>
                <span className="text-[12px] text-muted-foreground shrink-0 ml-2">Open →</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
