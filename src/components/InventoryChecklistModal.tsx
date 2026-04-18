// Inventory confirm-checklist.
// Triggered when the landlord uploads the Move-In Inventory. They tick off
// each item before it's filed in the Vault. Issues raised here are surfaced
// as activity events so the audit trail is honest.

import { useMemo, useState } from "react";
import { Check, AlertTriangle, X } from "lucide-react";

const PURPLE = "#534AB7";
const AMBER_BG = "#FFFAEE";
const AMBER_TEXT = "#854F0B";

const DEFAULT_ROOMS: { room: string; items: string[] }[] = [
  { room: "Kitchen", items: ["Oven & hob", "Fridge / freezer", "Dishwasher", "Cupboards & worktops", "Flooring"] },
  { room: "Living room", items: ["Sofa", "Carpet / flooring", "Curtains / blinds", "Light fittings"] },
  { room: "Bedroom", items: ["Bed frame", "Mattress", "Wardrobe", "Carpet / flooring"] },
  { room: "Bathroom", items: ["Bath / shower", "Toilet", "Sink & taps", "Tiles & sealant"] },
  { room: "Hallway & exterior", items: ["Front door & locks", "Smoke alarm", "CO alarm", "Meter cupboard"] },
];

export interface InventoryChecklistModalProps {
  propertyAddress: string;
  filename: string;
  onClose: () => void;
  onConfirm: (summary: { confirmed: number; total: number; issues: string[] }) => void;
}

type ItemState = "ok" | "issue" | null;

export function InventoryChecklistModal({
  propertyAddress, filename, onClose, onConfirm,
}: InventoryChecklistModalProps) {
  const all = useMemo(
    () => DEFAULT_ROOMS.flatMap((r) => r.items.map((i) => `${r.room}: ${i}`)),
    [],
  );
  const [state, setState] = useState<Record<string, ItemState>>({});

  const counts = useMemo(() => {
    let ok = 0, issue = 0;
    for (const k of all) {
      if (state[k] === "ok") ok++;
      if (state[k] === "issue") issue++;
    }
    return { ok, issue, total: all.length };
  }, [state, all]);

  const allReviewed = counts.ok + counts.issue === counts.total;

  const setAllOk = () => {
    const next: Record<string, ItemState> = {};
    for (const k of all) next[k] = "ok";
    setState(next);
  };

  const handleConfirm = () => {
    const issues = all.filter((k) => state[k] === "issue");
    onConfirm({ confirmed: counts.ok, total: counts.total, issues });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card hairline rounded-xl w-full max-w-2xl max-h-[88vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 hairline-b">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider" style={{ color: PURPLE, fontWeight: 500 }}>
              Confirm inventory · ✦
            </p>
            <h3 className="text-[16px] text-foreground font-medium mt-1 truncate">{filename}</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{propertyAddress}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Intro */}
        <div className="px-6 pt-3 pb-2">
          <p className="text-[12px] text-muted-foreground">
            Tick each item to confirm it's present and in working order, or flag an issue. The signed
            checklist is filed alongside the inventory as evidence.
          </p>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {DEFAULT_ROOMS.map((room) => (
            <div key={room.room} className="mb-4">
              <p
                className="text-[11px] font-medium text-muted-foreground mb-2"
                style={{ letterSpacing: "0.5px", textTransform: "uppercase" }}
              >
                {room.room}
              </p>
              <div className="bg-background hairline rounded-lg overflow-hidden">
                {room.items.map((item, i) => {
                  const key = `${room.room}: ${item}`;
                  const s = state[key];
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-3 px-3 py-2 ${i > 0 ? "hairline-t" : ""}`}
                    >
                      <span className="flex-1 text-[13px] text-foreground">{item}</span>
                      <button
                        onClick={() => setState((p) => ({ ...p, [key]: p[key] === "ok" ? null : "ok" }))}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors"
                        style={{
                          backgroundColor: s === "ok" ? "#1F5A3A" : "transparent",
                          color: s === "ok" ? "white" : "hsl(var(--muted-foreground))",
                          border: s === "ok" ? "none" : "0.5px solid hsl(var(--border))",
                        }}
                      >
                        <Check className="w-3 h-3" /> OK
                      </button>
                      <button
                        onClick={() => setState((p) => ({ ...p, [key]: p[key] === "issue" ? null : "issue" }))}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors"
                        style={{
                          backgroundColor: s === "issue" ? AMBER_BG : "transparent",
                          color: s === "issue" ? AMBER_TEXT : "hsl(var(--muted-foreground))",
                          border: s === "issue" ? "0.5px solid #E5C870" : "0.5px solid hsl(var(--border))",
                          fontWeight: s === "issue" ? 500 : 400,
                        }}
                      >
                        <AlertTriangle className="w-3 h-3" /> Issue
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="hairline-t px-6 py-4 flex items-center gap-3">
          <div className="flex-1 text-[12px] text-muted-foreground">
            {counts.ok} ok · {counts.issue} flagged · {counts.total - counts.ok - counts.issue} to review
          </div>
          <button
            onClick={setAllOk}
            className="px-3 py-2 rounded-lg text-[12px] hover:bg-secondary text-muted-foreground"
            style={{ border: "0.5px solid hsl(var(--border))" }}
          >
            Mark all OK
          </button>
          <button
            onClick={handleConfirm}
            disabled={!allReviewed}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white disabled:opacity-40"
            style={{ backgroundColor: PURPLE }}
          >
            Confirm & file
          </button>
        </div>
      </div>
    </div>
  );
}
