// Top-level Alerts page. Aggregates alerts across the portfolio (landlord)
// or the single property (tenant). Each row is clickable and routes the
// user into the relevant property tab (Tasks or Vault).

import { useMemo } from "react";
import { type Property, type VaultDoc } from "@/data/constants";
import { getPropertyAlerts } from "@/data/helpers";

interface AlertsPageProps {
  portfolio: Property[];
  allVaults: Record<string, VaultDoc[]>;
  onOpenAlert: (propId: string, linkedTab?: string) => void;
}

export function AlertsPage({ portfolio, allVaults, onOpenAlert }: AlertsPageProps) {
  const alerts = useMemo(() => {
    return portfolio.flatMap((p) => {
      const vault = allVaults[p.id] ?? [];
      return getPropertyAlerts(p.id, vault);
    });
  }, [portfolio, allVaults]);

  const high = alerts.filter((a) => a.severity === "high");
  const medium = alerts.filter((a) => a.severity !== "high");

  return (
    <div className="space-y-6 pb-12">
      <div>
        <p
          className="text-[12px] text-muted-foreground"
          style={{ letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 500 }}
        >
          Alerts
        </p>
        <h1 className="text-[24px] font-medium text-foreground tracking-tight mt-1">
          {alerts.length === 0
            ? "All clear"
            : `${alerts.length} ${alerts.length === 1 ? "item needs" : "items need"} attention`}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {alerts.length === 0
            ? "Nothing requires action right now."
            : "Sorted by urgency. Click any item to open it."}
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-card hairline rounded-xl p-12 text-center">
          <p className="text-[13px] text-muted-foreground">No active alerts across your portfolio.</p>
        </div>
      ) : (
        <>
          {high.length > 0 && (
            <Section title={`Urgent · ${high.length}`}>
              {high.map((a, i) => (
                <AlertRow key={`h-${i}`} alert={a} onOpen={onOpenAlert} />
              ))}
            </Section>
          )}
          {medium.length > 0 && (
            <Section title={`Upcoming · ${medium.length}`}>
              {medium.map((a, i) => (
                <AlertRow key={`m-${i}`} alert={a} onOpen={onOpenAlert} />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="font-medium text-muted-foreground"
        style={{ fontSize: "12px", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "10px" }}
      >
        {title}
      </h2>
      <div className="bg-card hairline rounded-xl overflow-hidden">{children}</div>
    </section>
  );
}

function AlertRow({
  alert, onOpen,
}: {
  alert: ReturnType<typeof getPropertyAlerts>[number];
  onOpen: (propId: string, linkedTab?: string) => void;
}) {
  const danger = alert.severity === "high";
  return (
    <button
      onClick={() => onOpen(alert.propId, alert.linkedTab)}
      className="w-full text-left flex items-center gap-3 px-4 py-3 hairline-b last:border-b-0 hover:bg-secondary/40 transition-colors"
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: danger ? "#A32D2D" : "#B8860B" }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-foreground truncate">{alert.text}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{alert.property}</p>
      </div>
      <span className="text-[12px] font-medium text-foreground shrink-0">{alert.action} →</span>
    </button>
  );
}
