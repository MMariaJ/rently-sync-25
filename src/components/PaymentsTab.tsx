import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Check, AlertCircle, Hash, ChevronDown,
  Shield, ArrowRight, Zap,
} from "lucide-react";
import {
  PAYMENTS_BY_PROP, RECURRING_PAYMENTS,
  type Property,
} from "@/data/constants";

interface PaymentsTabProps {
  property: Property;
}

const DEPOSIT_STAGES = ["Received", "Protected", "Active", "Release Agreed", "Returned"];

export function PaymentsTab({ property: p }: PaymentsTabProps) {
  const payments = PAYMENTS_BY_PROP[p.id] || [];
  const recurring = RECURRING_PAYMENTS[p.id] || [];
  const missedCount = payments.filter(pm => pm.status === "missed").length;
  const [showHashes, setShowHashes] = useState<Set<number>>(new Set());

  // Deposit stage: simplified from property data
  const depositStage = p.depositRef ? 2 : 0; // "Active" if ref exists

  const toggleHash = (i: number) => {
    setShowHashes(prev => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Missed payment alert */}
      {missedCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-danger-muted border border-danger/20">
          <AlertCircle className="w-5 h-5 text-danger shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{missedCount} missed payment{missedCount > 1 ? "s" : ""}</p>
            <p className="text-xs text-muted-foreground">Send a reminder via Communications</p>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-danger text-primary-foreground text-xs font-semibold">
            Send reminder
          </button>
        </div>
      )}

      {/* Rent header */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display text-sm font-bold text-foreground">Monthly Rent</h3>
          <span className="text-xs text-muted-foreground">Via Open Banking</span>
        </div>
        <p className="font-display text-3xl font-bold text-foreground">£{p.rent.toLocaleString()}</p>
      </div>

      {/* Rent Ledger */}
      <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-display text-sm font-bold text-foreground">Payment History</h3>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No payment history yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {payments.map((pm, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  pm.status === "verified" ? "bg-success-muted" : "bg-danger-muted"
                )}>
                  {pm.status === "verified" ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-danger" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{pm.amount}</span>
                    <span className={cn(
                      "text-[10px] font-semibold rounded-full px-2 py-0.5",
                      pm.status === "verified" ? "text-success bg-success-muted" : "text-danger bg-danger-muted"
                    )}>
                      {pm.status === "verified" ? "Verified" : "Missed"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{pm.date}</span>
                  {showHashes.has(i) && pm.hash && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground font-mono bg-secondary rounded px-2 py-0.5">
                      <Hash className="w-3 h-3" /> SHA-256: {pm.hash}
                    </div>
                  )}
                </div>

                {pm.hash && (
                  <button
                    onClick={() => toggleHash(i)}
                    className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showHashes.has(i) ? "Hide hash" : "Show hash"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deposit Lifecycle */}
      {p.depositRef && (
        <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
          <h3 className="font-display text-sm font-bold text-foreground mb-1">Deposit Lifecycle</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>{p.depositScheme} · {p.depositRef}</span>
          </div>

          <div className="flex items-center gap-1">
            {DEPOSIT_STAGES.map((stage, i) => {
              const isComplete = i < depositStage;
              const isCurrent = i === depositStage;
              return (
                <div key={stage} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shrink-0 mx-auto",
                      isComplete ? "bg-success border-success text-success-foreground" :
                      isCurrent ? "bg-primary border-primary text-primary-foreground" :
                      "bg-secondary border-border text-muted-foreground"
                    )}>
                      {isComplete ? <Check className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                  </div>
                  <span className={cn(
                    "text-[9px] font-medium text-center leading-tight",
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

      {/* Recurring Payments / Utilities */}
      {recurring.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Zap className="w-4 h-4 text-warning" />
            <h3 className="font-display text-sm font-bold text-foreground">Recurring Payments</h3>
          </div>
          <div className="divide-y divide-border">
            {recurring.map((rp) => (
              <div key={rp.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{rp.label}</p>
                  <p className="text-xs text-muted-foreground">{rp.provider} · Due {rp.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">£{rp.amount}</p>
                  <span className={cn(
                    "text-[10px] font-semibold rounded-full px-2 py-0.5",
                    rp.status === "paid" ? "text-success bg-success-muted" :
                    rp.status === "overdue" ? "text-danger bg-danger-muted" :
                    rp.status === "due_soon" ? "text-warning bg-warning-muted" :
                    "text-muted-foreground bg-secondary"
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
    </motion.div>
  );
}
