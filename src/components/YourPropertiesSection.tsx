interface PropertyRow {
  name: string;
  rent: number;
  rating: number;
  compliance: string;
  payment: string;
  /** "danger" → 3px red left edge; "default" → no accent */
  accent?: "default" | "danger";
  /** When set, replaces payment text with this red label */
  paymentDanger?: string;
}

interface YourPropertiesSectionProps {
  properties?: PropertyRow[];
  onSelect?: (name: string) => void;
}

const DEFAULT_PROPERTIES: PropertyRow[] = [
  {
    name: "7 Crane Wharf",
    rent: 1850,
    rating: 4.7,
    compliance: "All compliant · EICR due in 110 days",
    payment: "Paid 3 Apr",
  },
  {
    name: "14 Elmwood Road",
    rent: 1650,
    rating: 4.9,
    compliance: "All compliant · Gas safety due in 81 days",
    payment: "Paid 1 Apr",
  },
  {
    name: "3 Saffron Court",
    rent: 1620,
    rating: 4.6,
    compliance: "All compliant · AST renews in 95 days",
    payment: "Paid 1 Apr",
  },
];

export function YourPropertiesSection({ properties = DEFAULT_PROPERTIES, onSelect }: YourPropertiesSectionProps) {
  return (
    <section>
      <h2 className="label-eyebrow mb-3">Your properties</h2>

      <div
        className="bg-card overflow-hidden"
        style={{
          borderRadius: "16px",
          border: "0.5px solid hsl(var(--border))",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        {properties.map((p, idx) => {
          const isDanger = p.accent === "danger";
          return (
            <button
              key={p.name}
              onClick={() => onSelect?.(p.name)}
              className={`w-full text-left px-5 py-4 transition-colors hover:bg-secondary/60 ${idx > 0 ? "hairline-t" : ""}`}
              style={isDanger ? { boxShadow: "inset 3px 0 0 0 hsl(var(--danger))" } : undefined}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-medium text-foreground truncate" style={{ letterSpacing: "-0.01em" }}>
                  {p.name}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[14px] font-medium tabular-nums text-foreground">
                    £{p.rent.toLocaleString()}
                  </span>
                  <span className="text-[12px] text-muted-foreground tabular-nums flex items-center gap-1">
                    <span style={{ color: "#0F6E56" }}>★</span> {p.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 mt-1.5">
                <span className="text-[13px] text-muted-foreground truncate">
                  {p.compliance}
                </span>
                {p.paymentDanger ? (
                  <span
                    className="text-[11px] shrink-0 tabular-nums font-medium"
                    style={{ color: "hsl(var(--danger))" }}
                  >
                    {p.paymentDanger}
                  </span>
                ) : (
                  <span
                    className="text-[11px] shrink-0 tabular-nums"
                    style={{ color: "hsl(var(--muted-foreground) / 0.7)" }}
                  >
                    {p.payment}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export type { PropertyRow };
