// Top-level Reviews page (landlord). The tenant side lives inline inside
// TenantHome so never reaches this route.
//
// Renders the same personal two-zone layout as ReviewsTab with
// role="landlord" — received-then-given — and keeps the existing header
// frame so the landlord's top-level nav entry still feels like a page.

import { ReviewsTab } from "./ReviewsTab";
import type { ReviewEntry, AppActions } from "@/state/useAppStore";
import type { Property } from "@/data/constants";

interface ReviewsPageProps {
  portfolio: Property[];
  isLandlord: boolean;
  onOpenProperty: (propId: string) => void;
  reviews?: ReviewEntry[];
  onAddReview?: AppActions["addReview"];
}

export function ReviewsPage({
  portfolio, isLandlord, reviews, onAddReview,
}: ReviewsPageProps) {
  // Header copy stays role-aware; the body always renders the personal
  // two-zone layout for whichever role is visiting.
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
          {isLandlord ? "Your reputation" : "Your reviews"}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Verified two-way reviews build trust on both sides of the tenancy.
        </p>
      </div>

      <ReviewsTab
        property={portfolio[0]}
        reviews={reviews}
        onAddReview={onAddReview}
        role={isLandlord ? "landlord" : "tenant"}
      />
    </div>
  );
}
