import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { StarRating } from "./StarRating";
import {
  PROP_RATINGS, TENANT_INFO, HMO_TENANTS, LANDLORD_PROFILE,
  type Property,
} from "@/data/constants";
import type { ReviewEntry, AppActions } from "@/state/useAppStore";

const PURPLE = "#534AB7";
const PURPLE_TINT = "#F7F5FD";

interface ReviewsTabProps {
  property: Property;
  reviews?: ReviewEntry[];
  onAddReview?: AppActions["addReview"];
}

interface SeedReview {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  role: "landlord" | "tenant";
}

const SEED_REVIEWS: Record<string, SeedReview[]> = {
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

type Combined = SeedReview;

export function ReviewsTab({ property: p, reviews = [], onAddReview }: ReviewsTabProps) {
  const seeded = SEED_REVIEWS[p.id] || [];
  const userAdded: Combined[] = reviews
    .filter((r) => r.propId === p.id)
    .map((r) => ({
      id: r.id,
      author: r.author,
      avatar: r.avatar ?? LANDLORD_PROFILE.avatarUrl,
      rating: r.rating,
      date: r.date,
      text: r.text,
      role: r.role,
    }));

  const all = useMemo(() => [...userAdded, ...seeded], [userAdded, seeded]);

  // Recompute average from the full set so new reviews move the dial.
  const avg = useMemo(() => {
    if (all.length === 0) return PROP_RATINGS[p.id]?.rating ?? 0;
    const sum = all.reduce((s, r) => s + r.rating, 0);
    return Math.round((sum / all.length) * 10) / 10;
  }, [all, p.id]);

  const tenantReviews = all.filter((r) => r.role === "tenant");
  const landlordReviews = all.filter((r) => r.role === "landlord");

  const [composeOpen, setComposeOpen] = useState(false);

  const tenantTarget = TENANT_INFO[p.id]?.name ?? HMO_TENANTS[p.id]?.[0]?.name ?? "your tenant";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-card hairline rounded-xl p-8 text-center">
        <p className="text-[40px] tabular-nums text-foreground font-medium tracking-tight">{avg.toFixed(1)}</p>
        <div className="flex items-center justify-center mt-2 mb-2">
          <StarRating rating={avg} size={18} />
        </div>
        <p className="text-[13px] text-muted-foreground">{all.length} reviews from this property</p>
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
        {onAddReview && (
          <button
            onClick={() => setComposeOpen(true)}
            className="mt-5 px-4 py-2 rounded-lg text-[13px] font-medium text-white"
            style={{ backgroundColor: PURPLE }}
          >
            Review {tenantTarget}
          </button>
        )}
      </div>

      <div className="bg-card hairline rounded-xl overflow-hidden">
        <div className="px-5 py-4 hairline-b">
          <p className="text-[13px] text-foreground font-medium">All reviews</p>
        </div>
        <div>
          {all.map((review, idx) => (
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

      {composeOpen && onAddReview && (
        <ComposeReviewModal
          target={tenantTarget}
          onClose={() => setComposeOpen(false)}
          onSubmit={({ rating, text }) => {
            onAddReview({
              propId: p.id,
              author: LANDLORD_PROFILE.name,
              avatar: LANDLORD_PROFILE.avatarUrl,
              role: "landlord",
              rating,
              text,
            });
            setComposeOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ComposeReviewModal({
  target, onClose, onSubmit,
}: {
  target: string;
  onClose: () => void;
  onSubmit: (v: { rating: number; text: string }) => void;
}) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");

  const display = hover || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card hairline rounded-xl w-full max-w-md p-6">
        <h3 className="text-[16px] text-foreground font-medium">Review {target}</h3>
        <p className="text-[12px] text-muted-foreground mt-1">
          Both parties' reviews feed into tenant verification ✓ and landlord trust scores.
        </p>

        <div className="mt-5 rounded-lg p-4" style={{ backgroundColor: PURPLE_TINT }}>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Rating</p>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => {
              const filled = display >= s;
              return (
                <button
                  key={s}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(s)}
                  aria-label={`${s} stars`}
                >
                  <Star
                    size={26}
                    strokeWidth={1.5}
                    fill={filled ? PURPLE : "none"}
                    color={filled ? PURPLE : "hsl(var(--muted-foreground))"}
                  />
                </button>
              );
            })}
            <span className="ml-2 text-[14px] tabular-nums text-foreground font-medium">{display}.0</span>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 block">
            Your review
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`How has ${target.split(" ")[0]} been as a tenant?`}
            rows={4}
            className="w-full bg-secondary rounded-lg px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:bg-background focus:hairline resize-none"
          />
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-secondary text-foreground text-[13px] font-medium hover:bg-secondary/70 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ rating, text: text.trim() })}
            disabled={!text.trim()}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-white disabled:opacity-40"
            style={{ backgroundColor: PURPLE }}
          >
            Post review
          </button>
        </div>
      </div>
    </div>
  );
}
