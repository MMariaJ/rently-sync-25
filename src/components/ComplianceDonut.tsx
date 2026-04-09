import { cn } from "@/lib/utils";

interface ComplianceDonutProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

export function ComplianceDonut({ percentage, size = 52, strokeWidth = 5, className, showLabel = true }: ComplianceDonutProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color = percentage === 0
    ? "text-muted-foreground/30"
    : percentage < 50
      ? "text-danger"
      : percentage < 80
        ? "text-warning"
        : "text-success";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
        />
        {percentage > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn("transition-all duration-700 ease-out", color)}
          />
        )}
      </svg>
      {showLabel && (
        <span className="absolute text-[11px] font-bold text-foreground">
          {percentage}%
        </span>
      )}
    </div>
  );
}
