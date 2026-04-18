import { cn } from "@/lib/utils";
import { StarRating } from "./StarRating";
import {
  PROP_RATINGS,
  type Property,
} from "@/data/constants";

interface ReviewsTabProps {
  property: Property;
}

interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  role: "landlord" | "tenant";
}

const MOCK_REVIEWS: Record<string, Review[]> = {
  p1: [
    { id: "r1", author: "Sarah Mitchell", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face", rating: 5, date: "15 Feb 2026", text: "Great landlord, very responsive to maintenance requests and always professional.", role: "tenant" },
    { id: "r2", author: "Sarah Mitchell", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face", rating: 5, date: "5 Feb 2026", text: "Property was exactly as described. Very clean and well-maintained.", role: "tenant" },
    { id: "r3", author: "David Patel", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face", rating: 4.8, date: "10 Feb 2026", text: "Excellent tenant, always pays on time and keeps the property in great condition.", role: "landlord" },
  ],
  p2: [
    { id: "r4", author: "James Okafor", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face", rating: 4.5, date: "10 Jan 2026", text: "Good property but the EPC situation needs sorting. Otherwise a fair landlord.", role: "tenant" },
    { id: "r5", author: "James Okafor", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face", rating: 5, date: "1 Dec 2025", text: "Repairs handled quickly and professionally.", role: "tenant" },
    { id: "r6", author: "David Patel", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face", rating: 4.5, date: "15 Dec 2025", text: "Reliable tenant, good communication. One missed payment but resolved quickly.", role: "landlord" },
    { id: "r7", author: "David Patel", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face", rating: 5, date: "1 Nov 2025", text: "Very respectful of the property.", role: "landlord" },
    { id: "r8", author: "James Okafor", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face", rating: 4.5, date: "1 Oct 2025", text: "Everything has been straightforward.", role: "tenant" },
  ],
  p3: [
    { id: "r9", author: "Mia Chen", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face", rating: 5, date: "20 Feb 2026", text: "Well-managed HMO, common areas always clean.", role: "tenant" },
    { id: "r10", author: "Kwame Asante", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face", rating: 4.5, date: "10 Feb 2026", text: "Good landlord, handles shared living well.", role: "tenant" },
    { id: "r11", author: "Sofia Rossi", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face", rating: 4, date: "5 Feb 2026", text: "Nice property, still settling in.", role: "tenant" },
    { id: "r12", author: "David Patel", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face", rating: 4.8, date: "1 Mar 2026", text: "All three tenants are respectful and responsible.", role: "landlord" },
    { id: "r13", author: "David Patel", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face", rating: 4.5, date: "15 Jan 2026", text: "Smooth onboarding for all tenants.", role: "landlord" },
    { id: "r14", author: "Mia Chen", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face", rating: 4.5, date: "5 Jan 2026", text: "Responsive to requests.", role: "tenant" },
  ],
};

export function ReviewsTab({ property: p }: ReviewsTabProps) {
  const pr = PROP_RATINGS[p.id] || { rating: 0, count: 0 };
  const reviews = MOCK_REVIEWS[p.id] || [];
  const tenantReviews = reviews.filter(r => r.role === "tenant");
  const landlordReviews = reviews.filter(r => r.role === "landlord");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-card hairline rounded-xl p-8 text-center">
        <p className="text-[40px] tabular-nums text-foreground font-medium tracking-tight">{pr.rating}</p>
        <div className="flex items-center justify-center mt-2 mb-2">
          <StarRating rating={pr.rating} size={18} />
        </div>
        <p className="text-[13px] text-muted-foreground">{pr.count} reviews from this property</p>
        <div className="flex items-center justify-center gap-8 mt-5">
          <div className="text-center">
            <p className="text-[16px] tabular-nums text-foreground font-medium">{tenantReviews.length}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">From tenants</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-[16px] tabular-nums text-foreground font-medium">{landlordReviews.length}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">From landlord</p>
          </div>
        </div>
      </div>

      <div className="bg-card hairline rounded-xl overflow-hidden">
        <div className="px-5 py-4 hairline-b">
          <p className="text-[13px] text-foreground font-medium">All reviews</p>
        </div>
        <div>
          {reviews.map((review, idx) => (
            <div key={review.id} className={cn("px-5 py-4", idx > 0 && "hairline-t")}>
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={review.avatar}
                  alt={review.author}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-foreground font-medium">{review.author}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {review.role === "tenant" ? "Tenant" : "Landlord"}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{review.date}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <StarRating rating={review.rating} size={12} />
                  <span className="text-[13px] text-foreground tabular-nums">{review.rating}</span>
                </div>
              </div>
              <p className="text-[13px] text-foreground leading-relaxed">{review.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
