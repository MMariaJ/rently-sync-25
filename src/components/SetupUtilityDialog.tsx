// Two-step setup flow for utility-style tenant tasks (energy, water,
// broadband, council tax). Step 1 captures the account reference — either
// typed in or pulled from an uploaded welcome letter. Step 2 connects open
// banking so HomeBound can track the recurring payment automatically.
// Closing the dialog on the final step marks the underlying task as done.

import { useRef, useState, type ChangeEvent } from "react";
import { Check, FileText, Hash, Landmark, Upload } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const PURPLE = "#534AB7";
const PURPLE_TINT = "#F7F5FD";
const PURPLE_BORDER = "#E4E0FA";
const GREEN_DARK = "#27500A";
const GREEN_BG = "#EAF3DE";

export type UtilityTaskId = "t_u1" | "t_u2" | "t_u3" | "t_g1";

interface UtilityCopy {
  title: string;
  providerLabel: string;       // e.g. "Energy supplier"
  referenceLabel: string;      // e.g. "Account number"
  referencePlaceholder: string;
  welcomeLetterLabel: string;
  openBankingLine: string;     // what open banking will track
}

const COPY: Record<UtilityTaskId, UtilityCopy> = {
  t_u1: {
    title: "Set up energy supplier",
    providerLabel: "Energy supplier",
    referenceLabel: "Account number",
    referencePlaceholder: "e.g. 123456789",
    welcomeLetterLabel: "Welcome letter from your energy supplier",
    openBankingLine: "Match energy direct debits so your bills show up alongside rent.",
  },
  t_u2: {
    title: "Set up water account",
    providerLabel: "Water provider",
    referenceLabel: "Account number",
    referencePlaceholder: "e.g. 00123456-0",
    welcomeLetterLabel: "Welcome letter from your water company",
    openBankingLine: "Match water payments automatically so nothing falls through the cracks.",
  },
  t_u3: {
    title: "Set up broadband",
    providerLabel: "Broadband provider",
    referenceLabel: "Account number",
    referencePlaceholder: "e.g. BT-123456",
    welcomeLetterLabel: "Welcome letter or order confirmation",
    openBankingLine: "Track the monthly charge so you can spot price changes early.",
  },
  t_g1: {
    title: "Register for council tax",
    providerLabel: "Local council",
    referenceLabel: "Council tax reference",
    referencePlaceholder: "e.g. 6012345678",
    welcomeLetterLabel: "Council tax welcome / registration letter",
    openBankingLine: "Match monthly council tax instalments to your account.",
  },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: UtilityTaskId | null;
  onComplete: () => void;
}

type Mode = "number" | "letter";
type Step = "account" | "open-banking" | "done";

export function SetupUtilityDialog({ open, onOpenChange, taskId, onComplete }: Props) {
  const [mode, setMode] = useState<Mode>("number");
  const [accountNumber, setAccountNumber] = useState("");
  const [provider, setProvider] = useState("");
  const [letterName, setLetterName] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("account");
  const [connecting, setConnecting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const copy = taskId ? COPY[taskId] : null;

  const reset = () => {
    setMode("number");
    setAccountNumber("");
    setProvider("");
    setLetterName(null);
    setStep("account");
    setConnecting(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const accountStepValid =
    provider.trim().length > 0 &&
    (mode === "number" ? accountNumber.trim().length > 0 : letterName !== null);

  const onPickLetter = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLetterName(file.name);
  };

  const goToOpenBanking = () => setStep("open-banking");

  const connectBank = () => {
    setConnecting(true);
    // Simulated bank-link round-trip.
    setTimeout(() => {
      setConnecting(false);
      setStep("done");
    }, 900);
  };

  const finish = () => {
    onComplete();
    handleOpenChange(false);
  };

  if (!copy) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>
            {step === "account"
              ? "Add the account details so we can track what you pay and when."
              : step === "open-banking"
                ? "Connect your bank so payments are matched automatically."
                : "You're all set."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center" style={{ gap: "8px", marginBottom: "4px" }}>
          <StepPill idx={1} label="Account" active={step === "account"} done={step !== "account"} />
          <div style={{ flex: 1, height: "1px", background: "hsl(var(--border))" }} />
          <StepPill idx={2} label="Open banking" active={step === "open-banking"} done={step === "done"} />
        </div>

        {step === "account" && (
          <div className="space-y-3">
            <LabeledField label={copy.providerLabel}>
              <input
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder={`e.g. ${defaultProvider(taskId!)}`}
                className="w-full"
                style={fieldStyle}
              />
            </LabeledField>

            <div
              className="grid"
              style={{ gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "4px" }}
            >
              <ModeChip
                icon={<Hash className="w-3.5 h-3.5" />}
                label="Enter account number"
                active={mode === "number"}
                onClick={() => setMode("number")}
              />
              <ModeChip
                icon={<FileText className="w-3.5 h-3.5" />}
                label="Upload welcome letter"
                active={mode === "letter"}
                onClick={() => setMode("letter")}
              />
            </div>

            {mode === "number" ? (
              <LabeledField label={copy.referenceLabel}>
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={copy.referencePlaceholder}
                  className="w-full"
                  style={fieldStyle}
                />
              </LabeledField>
            ) : (
              <LabeledField label={copy.welcomeLetterLabel}>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center w-full text-left"
                  style={{
                    ...fieldStyle,
                    cursor: "pointer",
                    gap: "8px",
                    color: letterName ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {letterName ?? "Choose file (PDF or image)"}
                  </span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,image/*"
                  hidden
                  onChange={onPickLetter}
                />
              </LabeledField>
            )}

            <button
              onClick={goToOpenBanking}
              disabled={!accountStepValid}
              className="w-full font-medium text-white disabled:opacity-40"
              style={primaryBtnStyle}
            >
              Continue
            </button>
          </div>
        )}

        {step === "open-banking" && (
          <div className="space-y-3">
            <div
              className="flex items-start"
              style={{
                backgroundColor: PURPLE_TINT,
                border: `0.5px solid ${PURPLE_BORDER}`,
                borderRadius: "8px",
                padding: "12px",
                gap: "10px",
              }}
            >
              <Landmark className="w-4 h-4 shrink-0" style={{ color: PURPLE, marginTop: "2px" }} />
              <div>
                <p style={{ fontSize: "12px", fontWeight: 500, color: PURPLE, marginBottom: "4px" }}>
                  What open banking does
                </p>
                <p style={{ fontSize: "12px", color: "hsl(var(--foreground))", lineHeight: 1.5 }}>
                  {copy.openBankingLine} Read-only — we never move money, and you can disconnect any time.
                </p>
              </div>
            </div>

            <button
              onClick={connectBank}
              disabled={connecting}
              className="w-full font-medium text-white disabled:opacity-60"
              style={primaryBtnStyle}
            >
              {connecting ? "Connecting to your bank…" : "Connect bank"}
            </button>

            <button
              onClick={() => setStep("account")}
              className="w-full text-muted-foreground"
              style={{
                background: "transparent",
                border: "none",
                fontSize: "12px",
                padding: "6px",
                cursor: "pointer",
              }}
            >
              ← Back
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-3">
            <div
              className="flex items-start"
              style={{
                backgroundColor: GREEN_BG,
                border: "0.5px solid #D9E4C6",
                borderRadius: "8px",
                padding: "12px",
                gap: "10px",
              }}
            >
              <Check className="w-4 h-4 shrink-0" style={{ color: GREEN_DARK, marginTop: "2px" }} />
              <div>
                <p style={{ fontSize: "12px", fontWeight: 500, color: GREEN_DARK, marginBottom: "4px" }}>
                  {provider || "Account"} connected
                </p>
                <p style={{ fontSize: "12px", color: "hsl(var(--foreground))", lineHeight: 1.5 }}>
                  We'll flag the first payment as soon as it clears so you know everything is tracking.
                </p>
              </div>
            </div>

            <button
              onClick={finish}
              className="w-full font-medium text-white"
              style={primaryBtnStyle}
            >
              Mark task complete
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Helpers ===================================================================

const fieldStyle: React.CSSProperties = {
  border: "0.5px solid hsl(var(--border))",
  borderRadius: "8px",
  padding: "8px 10px",
  fontSize: "13px",
  background: "hsl(var(--background))",
};

const primaryBtnStyle: React.CSSProperties = {
  backgroundColor: PURPLE,
  border: "none",
  padding: "10px",
  borderRadius: "8px",
  fontSize: "13px",
  cursor: "pointer",
};

function defaultProvider(id: UtilityTaskId): string {
  switch (id) {
    case "t_u1": return "Octopus Energy";
    case "t_u2": return "Thames Water";
    case "t_u3": return "BT";
    case "t_g1": return "Lewisham Council";
  }
}

function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        style={{
          fontSize: "11px",
          color: "hsl(var(--muted-foreground))",
          letterSpacing: "0.4px",
          textTransform: "uppercase",
          marginBottom: "6px",
        }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function ModeChip({
  icon, label, active, onClick,
}: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center transition-colors"
      style={{
        gap: "6px",
        padding: "8px 10px",
        borderRadius: "8px",
        border: active ? `1px solid ${PURPLE}` : "0.5px solid hsl(var(--border))",
        backgroundColor: active ? PURPLE_TINT : "transparent",
        color: active ? PURPLE : "hsl(var(--foreground))",
        fontSize: "12px",
        fontWeight: active ? 500 : 400,
        cursor: "pointer",
      }}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

function StepPill({
  idx, label, active, done,
}: { idx: number; label: string; active: boolean; done: boolean }) {
  const color = done ? GREEN_DARK : active ? PURPLE : "hsl(var(--muted-foreground))";
  const bg = done ? GREEN_BG : active ? PURPLE_TINT : "transparent";
  return (
    <div
      className="flex items-center"
      style={{
        gap: "6px",
        fontSize: "11px",
        fontWeight: 500,
        color,
        backgroundColor: bg,
        padding: "4px 8px",
        borderRadius: "999px",
        border: "0.5px solid",
        borderColor: done ? "#D9E4C6" : active ? PURPLE_BORDER : "hsl(var(--border))",
      }}
    >
      <span
        className="flex items-center justify-center tabular-nums"
        style={{
          width: "16px",
          height: "16px",
          borderRadius: "999px",
          backgroundColor: color,
          color: "white",
          fontSize: "10px",
        }}
      >
        {done ? "✓" : idx}
      </span>
      {label}
    </div>
  );
}
