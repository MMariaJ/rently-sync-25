import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DeadlineEvent {
  date: Date;
  label: string;
  property: string;
  propId: string;
  severity: "low" | "medium" | "high"; // visual urgency
}

interface DeadlineCalendarProps {
  events: DeadlineEvent[];
  onSelectProperty?: (propId: string) => void;
}

const sevDot: Record<DeadlineEvent["severity"], string> = {
  high: "bg-danger",
  medium: "bg-warning",
  low: "bg-info",
};

export function DeadlineCalendar({ events, onSelectProperty }: DeadlineCalendarProps) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // make Mon=0

  const eventsByDay = useMemo(() => {
    const map = new Map<string, DeadlineEvent[]>();
    events.forEach((e) => {
      if (e.date.getFullYear() === year && e.date.getMonth() === month) {
        const key = String(e.date.getDate());
        const arr = map.get(key) || [];
        arr.push(e);
        map.set(key, arr);
      }
    });
    return map;
  }, [events, year, month]);

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const selectedEvents = selected
    ? events
        .filter((e) => isSameDay(e.date, selected))
        .sort((a, b) => (a.severity === "high" ? -1 : 1))
    : [];

  const goPrev = () => setCursor(new Date(year, month - 1, 1));
  const goNext = () => setCursor(new Date(year, month + 1, 1));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">{monthLabel}</p>
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            className="w-6 h-6 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={goNext}
            className="w-6 h-6 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div
            key={i}
            className="text-center text-[9px] font-bold text-muted-foreground uppercase tracking-wider py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const date = new Date(year, month, day);
          const dayEvents = eventsByDay.get(String(day)) || [];
          const isToday = isSameDay(date, today);
          const isSelected = selected && isSameDay(date, selected);
          const topSeverity: DeadlineEvent["severity"] | null = dayEvents.length
            ? dayEvents.some((e) => e.severity === "high")
              ? "high"
              : dayEvents.some((e) => e.severity === "medium")
              ? "medium"
              : "low"
            : null;

          return (
            <button
              key={i}
              onClick={() => setSelected(isSelected ? null : date)}
              className={cn(
                "relative aspect-square rounded-md flex flex-col items-center justify-center text-xs font-medium transition-all",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : isToday
                  ? "bg-secondary text-foreground ring-1 ring-primary/40"
                  : "text-foreground hover:bg-secondary",
                !dayEvents.length && !isSelected && !isToday && "text-muted-foreground/70"
              )}
            >
              <span>{day}</span>
              {topSeverity && !isSelected && (
                <span
                  className={cn(
                    "absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full",
                    sevDot[topSeverity]
                  )}
                />
              )}
              {dayEvents.length > 1 && !isSelected && (
                <span className="absolute top-0.5 right-1 text-[8px] font-bold text-muted-foreground">
                  {dayEvents.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-border min-h-[60px]">
        {selected ? (
          selectedEvents.length ? (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                {selected.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
              </p>
              {selectedEvents.map((e, i) => (
                <button
                  key={i}
                  onClick={() => onSelectProperty?.(e.propId)}
                  className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-secondary/60 transition-colors text-left"
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", sevDot[e.severity])} />
                  <span className="text-xs font-medium text-foreground flex-1 truncate">{e.label}</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{e.property}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground text-center py-2">Nothing scheduled.</p>
          )
        ) : (
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-danger" /> Overdue</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-warning" /> Due soon</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-info" /> Upcoming</span>
          </div>
        )}
      </div>
    </div>
  );
}
