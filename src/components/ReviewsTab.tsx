import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Star, ThumbsUp, MessageSquare } from "lucide-react";
import { StarRating } from "./StarRating";
import {
  PROP_RATINGS, TENANT_INFO, HMO_TENANTS,
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Overall rating */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-soft text-center">
        <p className="font-display text-4xl font-bold text-foreground mb-2">{pr.rating}</p>
        <div className="flex items-center justify-center mb-2">
          <StarRating rating={pr.rating} size={20} />
        </div>
        <p className="text-sm text-muted-foreground">{pr.count} reviews from this property</p>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="text-center">
            <p className="font-display text-lg font-bold text-foreground">{tenantReviews.length}</p>
            <p className="text-xs text-muted-foreground">From tenants</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="font-display text-lg font-bold text-foreground">{landlordReviews.length}</p>
            <p className="text-xs text-muted-foreground">From landlord</p>
          </div>
        </div>
      </div>

      {/* Review list */}
      <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-display text-sm font-bold text-foreground">All Reviews</h3>
        </div>
        <div className="divide-y divide-border">
          {reviews.map((review) => (
            <div key={review.id} className="px-5 py-4">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={review.avatar}
                  alt={review.author}
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-border"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{review.author}</span>
                    <span className={cn(
                      "text-[10px] font-semibold rounded-full px-2 py-0.5",
                      review.role === "tenant" ? "text-tenant bg-tenant-light" : "text-primary bg-landlord-light"
                    )}>
                      {review.role === "tenant" ? "Tenant" : "Landlord"}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{review.date}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="w-3.5 h-3.5 text-warning" fill="currentColor" />
                  <span className="text-sm font-bold text-foreground">{review.rating}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
