// Tenant-side lifecycle tasks.
//
// Mirrors the landlord LifecycleTasksTab in *shape* (grouped list, mark-done,
// remind), but pulls from TASK_DATA["tenant"] so the obligations are the
// tenant's: pay rent, sign AST, take move-in photos, register council tax, etc.

import { useMemo } from "react";
import { toast } from "sonner";
import {
  TASK_DATA, VAULT_INIT,
  type Property, type VaultDoc, type TaskItem,
} from "@/data/constants";
import type { LifecyclePhase } from "@/state/engines";
import type { AppActions } from "@/state/useAppStore";
import { Check, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const PURPLE = "#534AB7";
const GREEN = "#3B6D11";

interface TenantTasksTabProps {
  property: Property;
  completed: Record<string, boolean>;
  allVaults: Record<string, VaultDoc[]>;
  onMarkTaskDone: AppActions["markTaskDone"];
  onUnmarkTaskDone: AppActions["unmarkTaskDone"];
  onSetReminder: AppActions["setReminder"];
}

const PHASE_ORDER: LifecyclePhase[] = ["Pre-Move-In", "Move-In", "During Tenancy", "Move-Out"];
const PHASE_LABELS: Record<LifecyclePhase, string> = {
  "Pre-Move-In": "Pre-move-in",
  "Move-In": "Move-in",
  "During Tenancy": "Active tenancy",
  "Move-Out": "Move-out",
};

export function TenantTasksTab({
  property: p, completed, allVaults,
  onMarkTaskDone, onUnmarkTaskDone, onSetReminder,
}: TenantTasksTabProps) {
  const vault = allVaults[p.id] ?? VAULT_INIT;
  const isDocUp = (n: string) => vault.some(d => d.name === n && d.status === "uploaded");
  const isDone = (t: TaskItem) =>
    !!completed[`${p.id}_${t.id}`] || (!!t.vaultDoc && isDocUp(t.vaultDoc));

  const grouped = useMemo(() => {
    return PHASE_ORDER.map(ph => {
      const tasks = (TASK_DATA.tenant[ph] ?? []).filter(t => !t.isContractSign);
      return { phase: ph, tasks };
    }).filter(g => g.tasks.length > 0);
  }, []);

  const totalOpen = grouped.reduce(
    (s, g) => s + g.tasks.filter(t => !isDone(t)).length, 0,
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[16px] text-foreground font-medium">Your tasks</h3>
        <p className="text-[12px] text-muted-foreground tabular-nums">
          {totalOpen === 0 ? "All caught up" : `${totalOpen} open`}
        </p>
      </div>

      {grouped.map(({ phase, tasks }) => (
        <section key={phase}>
          <p
            className="text-[12px] text-muted-foreground mb-2.5"
            style={{ letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 500 }}
          >
            {PHASE_LABELS[phase]} · {tasks.filter(t => !isDone(t)).length} open
          </p>
          <div className="bg-card hairline rounded-xl overflow-hidden">
            {tasks.map((t, i) => {
              const done = isDone(t);
              return (
                <div
                  key={t.id}
                  className={cn(
                    "px-4 py-3 flex items-start gap-3",
                    i > 0 && "hairline-t",
                  )}
                >
                  <button
                    onClick={() => {
                      if (done) onUnmarkTaskDone(p.id, t.id);
                      else {
                        onMarkTaskDone(p.id, t.id, t.label);
                        toast.success("Task marked complete", { description: t.label });
                      }
                    }}
                    aria-label={done ? "Mark as not done" : "Mark complete"}
                    className="shrink-0 mt-0.5 rounded-full flex items-center justify-center transition-colors"
                    style={{
                      width: "18px", height: "18px",
                      border: done ? `0.5px solid ${GREEN}` : "0.5px solid hsl(var(--border))",
                      backgroundColor: done ? GREEN : "transparent",
                    }}
                  >
                    {done && <Check className="w-3 h-3" style={{ color: "#fff" }} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p
                        className={cn(
                          "text-[14px]",
                          done ? "text-muted-foreground line-through" : "text-foreground",
                        )}
                        style={{ fontWeight: 500 }}
                      >
                        {t.label}
                      </p>
                      {t.type === "legal" && (
                        <span
                          className="text-[10px] uppercase tabular-nums"
                          style={{
                            letterSpacing: "0.5px",
                            color: PURPLE,
                            fontWeight: 500,
                          }}
                        >
                          Legal
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                      {t.detail}
                    </p>
                  </div>

                  {!done && (
                    <button
                      onClick={() => {
                        onSetReminder(p.id, t.id, 7);
                        toast.success("Reminder set", { description: "We'll nudge you in 7 days." });
                      }}
                      className="shrink-0 flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Bell className="w-3 h-3" />
                      Remind
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
