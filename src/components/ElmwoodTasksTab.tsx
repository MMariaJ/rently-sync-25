// Static, hardcoded Tasks tab for 14 Elmwood Road (p1).
// Master-detail layout: grouped task list (left) + rich task detail panel (right).
// All values per design spec — no persistence, no interactive behaviour.

const PURPLE = "#534AB7";
const PURPLE_TINT = "#F7F5FD";
const AMBER_TEXT = "#854F0B";
const AMBER_BG = "#FAEEDA";
const RED_DARK = "#791F1F";
const RED_MID = "#A32D2D";
const RED_BORDER = "#F7C1C1";
const RED_BG = "#FDF6F5";

interface TaskRow {
  title: string;
  sub: string;
  right: { kind: "pill"; text: string } | { kind: "text"; text: string };
  selected?: boolean;
}

interface TaskGroup {
  label: string;
  rows: TaskRow[];
}

const STAGES = [
  { name: "Pre-move-in", count: "7 tasks open", active: true },
  { name: "Move-in", count: "no open tasks", active: false },
  { name: "Active tenancy", count: "ongoing", active: false },
  { name: "Move-out", count: "no open tasks", active: false },
];

const GROUPS: TaskGroup[] = [
  {
    label: "Time-bound · legal",
    rows: [
      {
        title: "Register deposit with TDP scheme",
        sub: "Statutory · 30 days from receipt",
        right: { kind: "pill", text: "22 days" },
        selected: true,
      },
      {
        title: "Provide 'How to Rent' guide",
        sub: "Must reach James before move-in",
        right: { kind: "text", text: "26 days" },
      },
    ],
  },
  {
    label: "Required · legal",
    rows: [
      {
        title: "Upload EPC (min. rating E)",
        sub: "Required before marketing · valid 10 years",
        right: { kind: "text", text: "—" },
      },
      {
        title: "Upload Gas Safety Certificate",
        sub: "Annual · required before move-in",
        right: { kind: "text", text: "—" },
      },
      {
        title: "Upload EICR (electrical report)",
        sub: "5-yearly · required before move-in",
        right: { kind: "text", text: "—" },
      },
    ],
  },
  {
    label: "Recommended",
    rows: [
      {
        title: "Upload property inventory + photos",
        sub: "Protects your deposit claim",
        right: { kind: "text", text: "—" },
      },
      {
        title: "Set initial meter readings",
        sub: "Gas, electricity, water",
        right: { kind: "text", text: "—" },
      },
    ],
  },
];

export function ElmwoodTasksTab() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Lifecycle tracker — same component as Overview, but bottom row differs */}
      <div className="bg-card hairline rounded-xl" style={{ padding: "1.25rem" }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] text-muted-foreground">Your lifecycle tasks</span>
          <span className="text-[12px] text-muted-foreground">2 of 9 done · 7 to go</span>
        </div>

        <div className="flex" style={{ gap: "8px" }}>
          {STAGES.map((s) => (
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
                className="text-[11px]"
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

        <div
          className="hairline-t flex items-center justify-between gap-3"
          style={{ marginTop: "14px", paddingTop: "14px" }}
        >
          <div className="min-w-0">
            <p className="text-[12px] text-muted-foreground">Most urgent</p>
            <p className="text-[14px] font-medium text-foreground mt-0.5">
              Register deposit with TDP scheme · due in 22 days
            </p>
          </div>
          <span
            className="shrink-0 font-medium"
            style={{
              fontSize: "11px",
              color: AMBER_TEXT,
              backgroundColor: AMBER_BG,
              padding: "3px 8px",
              borderRadius: "8px",
            }}
          >
            Statutory · 30-day limit
          </span>
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1.3fr 1fr" }}>
        {/* LEFT — Task list */}
        <section>
          <div className="flex items-center justify-between" style={{ marginBottom: "10px" }}>
            <h2
              className="font-medium text-muted-foreground"
              style={{
                fontSize: "12px",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Pre-move-in tasks
            </h2>
            <span className="text-[12px] text-muted-foreground">Sort: urgency ▾</span>
          </div>

          <div className="bg-card hairline rounded-xl" style={{ padding: "4px 0" }}>
            {GROUPS.map((group, gi) => (
              <div
                key={group.label}
                className={gi > 0 ? "hairline-t" : ""}
                style={gi > 0 ? { marginTop: "4px" } : undefined}
              >
                <p
                  className="font-medium"
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    color: "hsl(var(--muted-foreground) / 0.7)",
                    padding: "10px 16px 4px 16px",
                  }}
                >
                  {group.label}
                </p>

                {group.rows.map((row) => (
                  <div
                    key={row.title}
                    className="flex items-center"
                    style={{
                      gap: "12px",
                      padding: "10px 16px",
                      backgroundColor: row.selected ? PURPLE_TINT : undefined,
                      borderLeft: row.selected ? `3px solid ${PURPLE}` : undefined,
                    }}
                  >
                    <div
                      className="shrink-0"
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "0.5px solid hsl(var(--border))",
                        borderRadius: "3px",
                        backgroundColor: "hsl(var(--background))",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {row.title}
                      </p>
                      <p
                        className="text-[11px] truncate"
                        style={{ color: "hsl(var(--muted-foreground) / 0.7)" }}
                      >
                        {row.sub}
                      </p>
                    </div>
                    {row.right.kind === "pill" ? (
                      <span
                        className="shrink-0"
                        style={{
                          fontSize: "11px",
                          color: AMBER_TEXT,
                          backgroundColor: AMBER_BG,
                          padding: "3px 8px",
                          borderRadius: "8px",
                        }}
                      >
                        {row.right.text}
                      </span>
                    ) : (
                      <span
                        className="shrink-0 text-[12px] text-muted-foreground tabular-nums"
                      >
                        {row.right.text}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <p
            className="text-center"
            style={{
              fontSize: "12px",
              color: "hsl(var(--muted-foreground) / 0.7)",
              marginTop: "10px",
            }}
          >
            2 of 9 done ✦
          </p>
        </section>

        {/* RIGHT — Task detail panel */}
        <section>
          <h2
            className="font-medium text-muted-foreground"
            style={{
              fontSize: "12px",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            Task detail
          </h2>

          <div className="bg-card hairline rounded-xl" style={{ padding: "16px" }}>
            {/* a) Header row */}
            <div
              className="flex items-center"
              style={{ gap: "8px", marginBottom: "12px" }}
            >
              <span
                className="font-medium"
                style={{
                  fontSize: "11px",
                  color: AMBER_TEXT,
                  backgroundColor: AMBER_BG,
                  padding: "3px 8px",
                  borderRadius: "8px",
                }}
              >
                22 days left
              </span>
              <span className="text-[11px] text-muted-foreground">Statutory</span>
            </div>

            {/* b) Title */}
            <h3
              className="font-medium text-foreground"
              style={{ fontSize: "16px", marginBottom: "6px" }}
            >
              Register deposit with TDP scheme
            </h3>

            {/* c) Description */}
            <p
              className="text-muted-foreground"
              style={{ fontSize: "13px", lineHeight: 1.5, marginBottom: "16px" }}
            >
              James's £1,750 deposit must be protected with a government-approved scheme
              within 30 days of receipt.
            </p>

            {/* d) If missed */}
            <div
              style={{
                backgroundColor: RED_BG,
                border: `0.5px solid ${RED_BORDER}`,
                borderRadius: "8px",
                padding: "10px 12px",
                marginBottom: "16px",
              }}
            >
              <p
                className="font-medium"
                style={{
                  fontSize: "11px",
                  color: RED_DARK,
                  letterSpacing: "0.3px",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                If missed
              </p>
              <p style={{ fontSize: "12px", color: RED_MID, lineHeight: 1.5 }}>
                You lose the right to serve a Section 21. James could claim up to 3× the
                deposit (£5,250).
              </p>
            </div>

            {/* e) How this works */}
            <div style={{ marginBottom: "16px" }}>
              <p
                style={{
                  fontSize: "11px",
                  color: "hsl(var(--muted-foreground) / 0.7)",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                How this works
              </p>
              {[
                "Register with a TDP scheme (DPS, mydeposits, or TDS).",
                "Protect the deposit and receive a certificate.",
                "Upload the certificate here to mark this done.",
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex"
                  style={{ gap: "8px", marginBottom: "4px" }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      color: "hsl(var(--muted-foreground) / 0.7)",
                      lineHeight: 1.6,
                    }}
                  >
                    {i + 1}.
                  </span>
                  <span
                    className="text-muted-foreground"
                    style={{ fontSize: "12px", lineHeight: 1.6 }}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>

            {/* f) Context */}
            <div style={{ marginBottom: "16px" }}>
              <p
                style={{
                  fontSize: "11px",
                  color: "hsl(var(--muted-foreground) / 0.7)",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Context
              </p>
              {[
                { label: "Deposit received", value: "£1,750 · 20 Mar" },
                { label: "Statutory deadline", value: "19 Apr" },
                { label: "Tenant", value: "James Okafor" },
              ].map((r) => (
                <div
                  key={r.label}
                  className="flex items-center justify-between"
                  style={{ fontSize: "12px", padding: "3px 0" }}
                >
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="text-foreground tabular-nums">{r.value}</span>
                </div>
              ))}
            </div>

            {/* g) Actions */}
            <button
              className="w-full font-medium text-white"
              style={{
                backgroundColor: PURPLE,
                border: "none",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "8px",
              }}
            >
              Upload certificate
            </button>
            <div className="grid grid-cols-2" style={{ gap: "8px" }}>
              <button
                className="text-muted-foreground hairline"
                style={{
                  backgroundColor: "transparent",
                  padding: "8px",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              >
                Open DPS ↗
              </button>
              <button
                className="text-muted-foreground hairline"
                style={{
                  backgroundColor: "transparent",
                  padding: "8px",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              >
                Remind me
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
