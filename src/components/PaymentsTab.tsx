import { cn } from "@/lib/utils";
import { useState } from "react";
import { Check, Hash } from "lucide-react";
import {
  PAYMENTS_BY_PROP, RECURRING_PAYMENTS,
  type Property,
} from "@/data/constants";

interface PaymentsTabProps {
  property: Property;
}

const DEPOSIT_STAGES = ["Received", "Protected", "Active", "Release agreed", "Returned"];

export function PaymentsTab({ property: p }: PaymentsTabProps) {
  const payments = PAYMENTS_BY_PROP[p.id] || [];
  const recurring = RECURRING_PAYMENTS[p.id] || [];
  const missedCount = payments.filter(pm => pm.status === "missed").length;
  const [showHashes, setShowHashes] = useState<Set<number>>(new Set());

  const depositStage = p.depositRef ? 2 : 0;

  const toggleHash = (i: number) => {
    setShowHashes(prev => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {missedCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-danger-muted">
          <div className="flex-1">
            <p className="text-[14px] text-danger font-medium">{missedCount} missed payment{missedCount > 1 ? "s" : ""}</p>
            <p className="text-[12px] text-danger/70">Send a reminder via communications.</p>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-danger text-danger-foreground text-[12px] font-medium hover:opacity-90 transition-opacity">
            Send reminder
          </button>
        </div>
      )}

      <div className="bg-card hairline rounded-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="label-eyebrow">Monthly rent</p>
          <span className="text-[12px] text-muted-foreground">via Open Banking</span>
        </div>
        <p className="text-[28px] tabular-nums text-foreground font-medium tracking-tight mt-1">£{p.rent.toLocaleString()}</p>
      </div>

      <div className="bg-card hairline rounded-xl overflow-hidden">
        <div className="px-5 py-4 hairline-b">
          <p className="text-[13px] text-foreground font-medium">Payment history</p>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[13px] text-muted-foreground">No payment history yet.</p>
          </div>
        ) : (
          <div>
            {payments.map((pm, i) => (
              <div key={i} className={cn("px-5 py-3.5 flex items-center gap-4", i > 0 && "hairline-t")}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-foreground tabular-nums font-medium">{pm.amount}</span>
                    <span className={cn(
                      "text-[11px]",
                      pm.status === "verified" ? "text-muted-foreground" : "text-danger"
                    )}>
                      {pm.status === "verified" ? "Verified" : "Missed"}
                    </span>
                  </div>
                  <span className="text-[12px] text-muted-foreground">{pm.date}</span>
                  {showHashes.has(i) && pm.hash && (
                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground font-mono">
                      <Hash className="w-3 h-3" /> SHA-256: {pm.hash}
                    </div>
                  )}
                </div>

                {pm.hash && (
                  <button
                    onClick={() => toggleHash(i)}
                    className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showHashes.has(i) ? "Hide hash" : "Show hash"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {p.depositRef && (
        <div className="bg-card hairline rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="label-eyebrow">Deposit lifecycle</p>
            <span className="text-[12px] text-muted-foreground">{p.depositScheme} · {p.depositRef}</span>
          </div>

          <div className="flex items-center gap-1 mt-5">
            {DEPOSIT_STAGES.map((stage, i) => {
              const isComplete = i < depositStage;
              const isCurrent = i === depositStage;
              return (
                <div key={stage} className="flex-1 flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-[11px] tabular-nums shrink-0",
                    isComplete ? "bg-foreground text-background" :
                    isCurrent ? "bg-primary text-primary-foreground font-medium" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {isComplete ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={cn(
                    "text-[11px] text-center leading-tight",
                    isComplete || isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {recurring.length > 0 && (
        <div className="bg-card hairline rounded-xl overflow-hidden">
          <div className="px-5 py-4 hairline-b">
            <p className="text-[13px] text-foreground font-medium">Recurring payments</p>
          </div>
          <div>
            {recurring.map((rp, i) => (
              <div key={rp.id} className={cn("px-5 py-3.5 flex items-center justify-between", i > 0 && "hairline-t")}>
                <div>
                  <p className="text-[13px] text-foreground font-medium">{rp.label}</p>
                  <p className="text-[12px] text-muted-foreground">{rp.provider} · due {rp.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] text-foreground tabular-nums font-medium">£{rp.amount}</p>
                  <span className={cn(
                    "text-[11px]",
                    rp.status === "paid" ? "text-muted-foreground" :
                    rp.status === "overdue" ? "text-danger" :
                    rp.status === "due_soon" ? "text-warning" :
                    "text-muted-foreground"
                  )}>
                    {rp.status === "paid" ? "Paid" :
                     rp.status === "overdue" ? "Overdue" :
                     rp.status === "due_soon" ? "Due soon" : "Upcoming"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
