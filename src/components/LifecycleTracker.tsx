// Shared lifecycle tracker.
//
// Renders four equal columns — one per tenancy stage — with a 4px rail above
// each column: purple on the current stage, neutral elsewhere. Underneath,
// a hairline-top strip names the most urgent task and can carry an amber
// "blocking" pill plus optional trailing controls (e.g. prev/next buttons on
// the landlord side).
//
// Landlord follow-up: the Tasks tab has its own inline tracker in
// `LifecycleTasksTab.tsx` today. Migrating it to this component is a
// mechanical refactor — left as follow-up so this change stays tenant-only.

import type { ReactNode } from "react";

const PURPLE = "#534AB7";
const AMBER_TEXT = "#854F0B";
const AMBER_BG = "#FAEEDA";

export interface LifecycleStage {
  name: string;
  count: string;    // "2 open", "—", "all done"
  active: boolean;
}

export interface MostUrgent {
  title: string;
  days: number | null;
  // When true, renders an amber "blocking" pill next to the title.
  blocking?: boolean;
}

interface LifecycleTrackerProps {
  title: string;
  summary: string;
  stages: LifecycleStage[];
  mostUrgent?: MostUrgent | null;
  trailing?: ReactNode;
}

export function LifecycleTracker({
  title, summary, stages, mostUrgent, trailing,
}: LifecycleTrackerProps) {
  return (
    <div className="bg-card hairline rounded-xl" style={{ padding: "1.25rem" }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] text-muted-foreground">{title}</span>
        <span className="text-[12px] text-muted-foreground tabular-nums">{summary}</span>
      </div>

      <div className="flex" style={{ gap: "8px" }}>
        {stages.map((s) => (
          <div key={s.name} className="flex-1 flex flex-col" style={{ gap: "6px" }}>
            <div
              style={{
                height: "4px",
                borderRadius: "2px",
                backgroundColor: s.active ? PURPLE : "hsl(var(--border))",
              }}
            />
            <span
              className="text-[12px]"
              style={{
                color: s.active ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                fontWeight: s.active ? 500 : 400,
              }}
            >
              {s.name}
            </span>
            <span
              className="text-[11px] tabular-nums"
              style={{
                color: s.active
                  ? "hsl(var(--muted-foreground))"
                  : "hsl(var(--muted-foreground) / 0.7)",
              }}
            >
              {s.count}
            </span>
          </div>
        ))}
      </div>

      {(mostUrgent || trailing) && (
        <div
          className="hairline-t flex items-center justify-between gap-3"
          style={{ marginTop: "14px", paddingTop: "14px" }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-muted-foreground">Most urgent</p>
            <p className="text-[14px] font-medium text-foreground mt-0.5 truncate">
              {mostUrgent
                ? `${mostUrgent.title}${
                    mostUrgent.days !== null ? ` · ${formatDays(mostUrgent.days)}` : ""
                  }`
                : "All caught up"}
            </p>
          </div>

          {mostUrgent?.blocking && (
            <span
              className="shrink-0 font-medium tabular-nums"
              style={{
                fontSize: "11px",
                color: AMBER_TEXT,
                backgroundColor: AMBER_BG,
                padding: "3px 8px",
                borderRadius: "8px",
              }}
            >
              Blocking
            </span>
          )}

          {trailing}
        </div>
      )}
    </div>
  );
}

function formatDays(d: number): string {
  if (d === 0) return "Today";
  if (d < 0) return `${Math.abs(d)} days overdue`;
  return `${d} days`;
}
