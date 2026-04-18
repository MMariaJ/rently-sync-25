export type IncomeState = "healthy" | "late";

interface HealthRowProps {
  compliant: number;
  dueSoon: number;
  overdue: number;
  rentCollected: number;
  rentExpected: number;
  month: string;
  incomeState?: IncomeState;
  lateCount?: number;
}

export function HealthRow({
  compliant,
  dueSoon,
  overdue,
  rentCollected,
  rentExpected,
  month,
  incomeState = "healthy",
  lateCount = 0,
}: HealthRowProps) {
  const total = compliant + dueSoon + overdue;
  const allCompliant = dueSoon === 0 && overdue === 0;

  const isLate = incomeState === "late";
  const rentPct = rentExpected > 0 ? Math.min(100, (rentCollected / rentExpected) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-3">
      {/* LEFT — Compliance health */}
      <div className="bg-card hairline rounded-xl px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Compliance health</span>
          <span className="text-[13px] font-medium tabular-nums text-foreground">
            {compliant} of {total} on track
          </span>
        </div>

        <div className="mt-3 flex items-center gap-[3px] h-2">
          {allCompliant ? (
            <div className="h-full w-full rounded" style={{ backgroundColor: "hsl(var(--success))" }} />
          ) : (
            <>
              {compliant > 0 && (
                <div className="h-full rounded" style={{ flex: compliant, backgroundColor: "hsl(var(--success))" }} />
              )}
              {dueSoon > 0 && (
                <div className="h-full rounded" style={{ flex: dueSoon, backgroundColor: "hsl(var(--warning))" }} />
              )}
              {overdue > 0 && (
                <div className="h-full rounded" style={{ flex: overdue, backgroundColor: "hsl(var(--danger))" }} />
              )}
            </>
          )}
        </div>

        <div className="mt-3 flex items-center gap-4 text-[12px]">
          <span>
            <span className="font-medium tabular-nums text-foreground">{compliant}</span>{" "}
            <span className="text-muted-foreground">compliant</span>
          </span>
          <span className="text-muted-foreground">·</span>
          <span>
            <span className="font-medium tabular-nums text-foreground">{dueSoon}</span>{" "}
            <span className="text-muted-foreground">due soon</span>
          </span>
          <span className="text-muted-foreground">·</span>
          <span>
            <span className="font-medium tabular-nums text-foreground">{overdue}</span>{" "}
            <span className="text-muted-foreground">overdue</span>
          </span>
        </div>
      </div>

      {/* RIGHT — Income collected */}
      <div
        className="bg-card hairline rounded-xl px-5 py-4 relative overflow-hidden"
        style={
          isLate
            ? { boxShadow: "inset 3px 0 0 0 hsl(var(--danger))" }
            : undefined
        }
      >
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Income collected · {month}</span>
          <span
            className="text-[11px] rounded-lg px-2 py-0.5"
            style={
              isLate
                ? {
                    backgroundColor: "hsl(var(--danger-muted))",
                    color: "hsl(var(--danger))",
                  }
                : {
                    backgroundColor: "hsl(150 45% 35% / 0.12)",
                    color: "hsl(150 45% 22%)",
                  }
            }
          >
            {isLate ? `${lateCount} late` : "On track"}
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-[22px] font-medium tracking-tight tabular-nums text-foreground">
            £{rentCollected.toLocaleString()}
          </span>
          <span className="text-[12px] text-muted-foreground tabular-nums">
            of £{rentExpected.toLocaleString()} expected
          </span>
        </div>

        <div
          className="mt-3 h-1 rounded overflow-hidden"
          style={{ backgroundColor: isLate ? "hsl(240 5% 90%)" : "hsl(var(--secondary))" }}
        >
          <div
            className="h-full rounded"
            style={{
              width: `${rentPct}%`,
              backgroundColor: isLate ? "hsl(240 8% 12%)" : "hsl(var(--success))",
            }}
          />
        </div>
      </div>
    </div>
  );
}
