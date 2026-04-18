import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface DeadlineDate {
  date: Date;
  label: string;
  status: string;
  days: number;
  property?: string;
}

interface DeadlineCalendarProps {
  dates: DeadlineDate[];
  showUpcomingList?: boolean;
  upcomingLimit?: number;
}

export function DeadlineCalendar({ dates, showUpcomingList = true, upcomingLimit = 4 }: DeadlineCalendarProps) {
  const anchor = dates[0]?.date ?? new Date();
  const [viewYear, setViewYear] = useState(anchor.getFullYear());
  const [viewMonth, setViewMonth] = useState(anchor.getMonth());

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const dayMap = new Map<number, { label: string; status: string; days: number; property?: string }[]>();
  for (const d of dates) {
    if (d.date.getFullYear() === viewYear && d.date.getMonth() === viewMonth) {
      const day = d.date.getDate();
      const list = dayMap.get(day) || [];
      list.push({ label: d.label, status: d.status, days: d.days, property: d.property });
      dayMap.set(day, list);
    }
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth;
  const todayDay = isCurrentMonth ? today.getDate() : -1;
  const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  const goPrev = () => {
    const m = viewMonth - 1;
    if (m < 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(m);
  };
  const goNext = () => {
    const m = viewMonth + 1;
    if (m > 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(m);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={goPrev} aria-label="Previous month" className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[13px] text-foreground">{monthLabel}</span>
          <button onClick={goNext} aria-label="Next month" className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekdayLabels.map((w, i) => (
            <div key={i} className="text-[11px] text-muted-foreground py-1">{w}</div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={i} className="h-8" />;
            const marked = dayMap.get(day);
            const isToday = day === todayDay;
            const isOverdue = marked?.some((m) => m.status === "expired");
            const cellEl = (
              <div
                className={cn(
                  "h-8 w-8 mx-auto flex items-center justify-center text-[12px] rounded-full transition-colors cursor-default tabular-nums",
                  marked
                    ? isOverdue
                      ? "bg-danger-muted text-danger font-medium"
                      : "bg-primary/10 text-primary font-medium"
                    : isToday
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                  isToday && marked && "ring-1 ring-offset-2 ring-offset-background ring-foreground/20",
                )}
              >
                {day}
              </div>
            );
            if (!marked) return <div key={i}>{cellEl}</div>;
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>{cellEl}</TooltipTrigger>
                <TooltipContent side="top" className="text-[12px] max-w-[240px]">
                  {marked.map((m, j) => (
                    <div key={j} className={j > 0 ? "mt-2 pt-2 hairline-t" : ""}>
                      <p className="text-foreground font-medium">{m.label}</p>
                      {m.property && <p className="text-[11px] text-muted-foreground">{m.property}</p>}
                      <p className="text-[11px] text-muted-foreground">
                        {m.status === "expired" ? "Overdue" : `Due in ${m.days} days`}
                      </p>
                    </div>
                  ))}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {showUpcomingList && dates.length > 0 && (
          <div className="mt-5 pt-4 hairline-t space-y-2">
            <p className="label-eyebrow">Upcoming</p>
            {dates.slice(0, upcomingLimit).map((d, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-foreground truncate">{d.label}</p>
                  {d.property && <p className="text-[11px] text-muted-foreground truncate">{d.property}</p>}
                </div>
                <span className={cn(
                  "text-[11px] tabular-nums shrink-0",
                  d.status === "expired" ? "text-danger" : "text-muted-foreground"
                )}>
                  {d.status === "expired" ? "Overdue" : `${d.days}d`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
