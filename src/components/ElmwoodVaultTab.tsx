// Static, hardcoded Vault tab for 14 Elmwood Road (p1).
// Three-section attention-ranked layout:
//   1. Needs attention  (expired)
//   2. Still to collect (missing)
//   3. Filed & current  (filed, with inline expiring-soon row)

const PURPLE = "#534AB7";

// Red — Needs attention tier
const RED_LABEL = "#791F1F";
const RED_BG = "#FDF6F5";
const RED_BORDER = "#E24B4A";
const RED_DIVIDER = "#F7C1C1";
const RED_PILL_TEXT = "#A32D2D";
const RED_PILL_BG = "#FCEBEB";

// Amber — Expiring soon
const AMBER_BG = "#FFFAEE";
const AMBER_TEXT = "#854F0B";

// Reusable purple sparkle (U+2726)
const Sparkle = () => <span style={{ color: PURPLE }}>✦</span>;

interface FiledRow {
  title: string;
  subtitle: string;
  hasSparkle: boolean;
  amber?: boolean;
  rightLabel: string;
  rightAmber?: boolean;
}

const FILED_ROWS: FiledRow[] = [
  {
    title: "Tenancy agreement",
    subtitle: "Renews 23 Feb 2027 ·",
    hasSparkle: true,
    rightLabel: "View →",
  },
  {
    title: "Gas safety certificate",
    subtitle: "Expires in 47 days ·",
    hasSparkle: true,
    amber: true,
    rightLabel: "Renew soon →",
    rightAmber: true,
  },
  {
    title: "Move-in inventory",
    subtitle: "28 photos · 20 Mar ·",
    hasSparkle: true,
    rightLabel: "View →",
  },
  {
    title: "Boiler manual (Worcester)",
    subtitle: "Reference · uploaded 18 Mar",
    hasSparkle: false,
    rightLabel: "View →",
  },
  {
    title: "Communal garden key photo",
    subtitle: "From Comms · James · 22 Mar",
    hasSparkle: false,
    rightLabel: "View →",
  },
];

const STILL_TO_COLLECT: { label: string; items: string[] }[] = [
  { label: "Safety & compliance", items: ["EICR report"] },
  { label: "Tenancy & legal", items: ["How to Rent guide", "Deposit protection certificate"] },
  { label: "Utilities & setup", items: ["Initial meter readings", "Boiler service record"] },
];

export function ElmwoodVaultTab() {
  return (
    <div className="animate-fade-in">
      {/* 4. Vault header row */}
      <div
        className="flex items-end justify-between"
        style={{ marginBottom: "1rem" }}
      >
        <div>
          <p className="text-foreground" style={{ fontSize: "16px", fontWeight: 500 }}>
            5 documents filed
          </p>
          <p
            className="text-muted-foreground"
            style={{ fontSize: "12px", marginTop: "2px" }}
          >
            1 needs your attention · 5 still to collect
          </p>
        </div>

        <div className="flex items-center" style={{ gap: "8px" }}>
          <div className="relative">
            <span
              className="absolute"
              style={{
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "12px",
                color: "hsl(var(--muted-foreground) / 0.7)",
                pointerEvents: "none",
              }}
            >
              ⌕
            </span>
            <input
              type="text"
              placeholder="Search documents"
              style={{
                width: "200px",
                padding: "6px 12px 6px 30px",
                fontSize: "13px",
                border: "0.5px solid hsl(var(--border))",
                borderRadius: "8px",
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
                outline: "none",
              }}
            />
          </div>
          <button
            className="text-foreground"
            style={{
              padding: "6px 12px",
              fontSize: "13px",
              backgroundColor: "hsl(var(--card))",
              border: "0.5px solid hsl(var(--muted-foreground) / 0.3)",
              borderRadius: "8px",
            }}
          >
            + Upload
          </button>
        </div>
      </div>

      {/* 5. Needs attention */}
      <p
        className="font-medium"
        style={{
          fontSize: "12px",
          color: RED_LABEL,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          marginBottom: "10px",
        }}
      >
        Needs attention
      </p>

      <div
        style={{
          backgroundColor: RED_BG,
          border: `0.5px solid ${RED_BORDER}`,
          borderRadius: "12px",
          padding: "14px 16px",
          marginBottom: "1.5rem",
        }}
      >
        {/* Top zone */}
        <div
          className="flex items-start justify-between gap-3"
          style={{ marginBottom: "12px" }}
        >
          <div className="min-w-0">
            <p
              style={{
                fontSize: "11px",
                color: "hsl(var(--muted-foreground) / 0.7)",
                letterSpacing: "0.3px",
                textTransform: "uppercase",
                marginBottom: "2px",
              }}
            >
              EPC certificate · <Sparkle />
            </p>
            <p className="text-foreground" style={{ fontSize: "14px", fontWeight: 500 }}>
              EPC_14Elmwood_2016.pdf
            </p>
          </div>
          <span
            className="font-medium shrink-0"
            style={{
              fontSize: "12px",
              color: RED_PILL_TEXT,
              backgroundColor: RED_PILL_BG,
              padding: "3px 8px",
              borderRadius: "8px",
            }}
          >
            Expired 3 days ago
          </span>
        </div>

        {/* Bottom zone */}
        <div
          className="flex items-center justify-between gap-3"
          style={{ paddingTop: "10px", borderTop: `0.5px solid ${RED_DIVIDER}` }}
        >
          <p className="text-muted-foreground min-w-0" style={{ fontSize: "12px" }}>
            Rating D (62) · issued 14 Apr 2016 · valid 10 years
          </p>
          <div className="flex items-center shrink-0" style={{ gap: "8px" }}>
            <button
              className="text-muted-foreground"
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                backgroundColor: "transparent",
                border: "0.5px solid hsl(var(--muted-foreground) / 0.3)",
                borderRadius: "8px",
              }}
            >
              View
            </button>
            <button
              className="font-medium text-white"
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                backgroundColor: PURPLE,
                border: "none",
                borderRadius: "8px",
              }}
            >
              Renew →
            </button>
          </div>
        </div>
      </div>

      {/* 6. Still to collect */}
      <div
        className="flex items-baseline justify-between"
        style={{ marginBottom: "10px" }}
      >
        <p
          className="font-medium text-muted-foreground"
          style={{
            fontSize: "12px",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          Still to collect
        </p>
        <span
          style={{
            fontSize: "11px",
            color: "hsl(var(--muted-foreground) / 0.7)",
          }}
        >
          Managed via Tasks →
        </span>
      </div>

      <div
        className="bg-card hairline rounded-xl"
        style={{ padding: "4px 0", marginBottom: "1.5rem" }}
      >
        {STILL_TO_COLLECT.map((group, gi) => (
          <div
            key={group.label}
            className={gi > 0 ? "hairline-t" : ""}
            style={gi > 0 ? { marginTop: "4px" } : undefined}
          >
            <p
              style={{
                fontSize: "11px",
                color: "hsl(var(--muted-foreground) / 0.7)",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                padding: "10px 16px 4px 16px",
              }}
            >
              {group.label}
            </p>
            {group.items.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between"
                style={{ padding: "8px 16px" }}
              >
                <span className="text-foreground" style={{ fontSize: "13px" }}>
                  {item}
                </span>
                <span
                  className="text-muted-foreground"
                  style={{ fontSize: "12px" }}
                >
                  Add via Tasks →
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 7. Filed & current */}
      <div
        className="flex items-baseline justify-between"
        style={{ marginBottom: "10px" }}
      >
        <p
          className="font-medium text-muted-foreground"
          style={{
            fontSize: "12px",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          Filed & current
        </p>
        <span
          style={{
            fontSize: "11px",
            color: "hsl(var(--muted-foreground) / 0.7)",
          }}
        >
          5 documents
        </span>
      </div>

      <div className="bg-card hairline rounded-xl" style={{ padding: "4px 0" }}>
        {FILED_ROWS.map((row, i) => (
          <div
            key={row.title}
            className="flex items-center justify-between gap-3"
            style={{
              padding: "10px 16px",
              backgroundColor: row.amber ? AMBER_BG : undefined,
            }}
          >
            <div className="min-w-0">
              <p className="text-foreground" style={{ fontSize: "13px" }}>
                {row.title}
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: row.amber ? AMBER_TEXT : "hsl(var(--muted-foreground) / 0.7)",
                  marginTop: "1px",
                }}
              >
                {row.subtitle}
                {row.hasSparkle && <> <Sparkle /></>}
              </p>
            </div>
            <span
              className="shrink-0"
              style={{
                fontSize: "12px",
                color: row.rightAmber ? AMBER_TEXT : "hsl(var(--muted-foreground) / 0.7)",
                fontWeight: row.rightAmber ? 500 : 400,
              }}
            >
              {row.rightLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
