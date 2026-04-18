interface UpcomingItem {
  title: string;
  property: string;
  days: number;
}

interface UpcomingGroup {
  label: string;
  items: UpcomingItem[];
  amberPill?: boolean;
}

interface WhatsComingUpSectionProps {
  groups?: UpcomingGroup[];
  closingNote?: string;
}

const DEFAULT_GROUPS: UpcomingGroup[] = [
  {
    label: "This month",
    amberPill: true,
    items: [{ title: "Gas Safety Certificate", property: "14 Elmwood Road", days: 81 }],
  },
  {
    label: "Later this year",
    items: [
      { title: "Tenancy Agreement", property: "3 Saffron Court", days: 95 },
      { title: "EICR Report", property: "7 Crane Wharf", days: 110 },
      { title: "Deposit Protection", property: "3 Saffron Court", days: 130 },
    ],
  },
];

const eyebrowStyle = {
  fontSize: "12px",
  letterSpacing: "0.5px",
  textTransform: "uppercase" as const,
};

export function WhatsComingUpSection({
  groups = DEFAULT_GROUPS,
  closingNote = `Nice work — you're on top of things ${"\u2726"}`,
}: WhatsComingUpSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="font-medium text-muted-foreground" style={eyebrowStyle}>
          What's coming up
        </h2>
        <button className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
          View calendar
        </button>
      </div>

      <div className="bg-card hairline rounded-xl py-1">
        {groups.map((group, gIdx) => (
          <div key={group.label} className={gIdx > 0 ? "hairline-t mt-1 pt-0" : ""}>
            <div
              className="font-medium px-4 pt-2.5 pb-1"
              style={{
                fontSize: "11px",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                color: "hsl(var(--muted-foreground) / 0.7)",
              }}
            >
              {group.label}
            </div>

            {group.items.map((item) => (
              <div
                key={`${item.title}-${item.property}`}
                className="flex items-center justify-between gap-3 px-4 py-2"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-[12px] text-muted-foreground truncate">{item.property}</p>
                </div>
                <div className="shrink-0">
                  {group.amberPill ? (
                    <span
                      className="text-[11px] tabular-nums rounded-lg"
                      style={{
                        padding: "3px 8px",
                        backgroundColor: "hsl(var(--warning-muted))",
                        color: "hsl(var(--warning))",
                      }}
                    >
                      {item.days} days
                    </span>
                  ) : (
                    <span className="text-[12px] text-muted-foreground tabular-nums">
                      {item.days} days
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <p className="text-[12px] text-muted-foreground text-center mt-2.5">
        {closingNote}
      </p>
    </section>
  );
}

export type { UpcomingGroup, UpcomingItem };
