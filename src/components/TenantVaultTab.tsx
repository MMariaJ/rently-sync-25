// Tenant-side Vault tab.
//
// Three zones, read-forward (landlord side is upload-forward):
//   1. Waiting on your landlord — conditional, surfaces required docs past
//      their statutory deadline with a Nudge / Raise-formally escalation.
//   2. For you to upload — tenant-owned slots, uploads go through Tasks.
//   3. Filed & current — everything on file, regardless of uploader.
//
// Intentionally does not share its shell with LifecycleVaultTab — the two
// sides have different information architectures — but the filed-row layout
// mirrors the landlord Vault's so a doc looks the same wherever you see it.

import { toast } from "sonner";
import {
  VAULT_INIT,
  type Property, type VaultDoc,
} from "@/data/constants";
import { getOverdueLandlordDocs, type OverdueLandlordDoc } from "@/data/helpers";
import type { ExtractedFacts } from "@/state/engines";
import type { AppActions } from "@/state/useAppStore";

const PURPLE = "#534AB7";

// Red — Waiting-on-landlord zone
const RED_HEAD = "#791F1F";
const RED_SUB = "#A32D2D";
const RED_BG = "#FDF6F5";
const RED_BORDER = "#F7C1C1";
const RED_INSET_BG = "#FCEBEB";

const BUTTON_BORDER = "#CBD5E1";

// Tenant-perspective friendly names for the few docs a tenant sees.
const DISPLAY_NAME: Record<string, string> = {
  "Tenancy Agreement (AST)": "Tenancy agreement",
  "Gas Safety Certificate": "Gas safety certificate",
  "EPC Certificate": "EPC certificate",
  "EICR Report": "EICR report",
  "How to Rent Guide": "How to Rent guide",
  "Deposit Protection Certificate": "Deposit protection certificate",
  "Move-In Inventory": "Move-in inventory",
  "Move-In Photos": "Move-in photos",
  "Move-Out Photos": "Move-out photos",
  "HMO Licence": "HMO licence",
  "Smoke & CO Alarm Evidence": "Smoke & CO alarm evidence",
  "Meter Reading Photos": "Meter reading photos",
};

const displayName = (n: string) => DISPLAY_NAME[n] ?? n;

const Sparkle = () => <span style={{ color: PURPLE }}>✦</span>;

interface TenantVaultTabProps {
  property: Property;
  allVaults: Record<string, VaultDoc[]>;
  extractedFacts: Record<string, ExtractedFacts>;
  onSwitchToTasks: () => void;
  onNudgeLandlord: AppActions["nudgeLandlord"];
}

export function TenantVaultTab({
  property, allVaults, extractedFacts,
  onSwitchToTasks, onNudgeLandlord,
}: TenantVaultTabProps) {
  const vault = allVaults[property.id] ?? VAULT_INIT;
  const isHmo = !!property.isHmo;

  const overdue = getOverdueLandlordDocs(property, vault);
  const tenantToUpload = vault.filter(
    (d) => d.owner === "tenant" && d.status !== "uploaded",
  );
  const filed = vault
    .filter((d) => d.status === "uploaded")
    .filter((d) => isHmo || d.name !== "HMO Licence");

  const filedCount = filed.length;
  const filedNoun = filedCount === 1 ? "document" : "documents";

  const subParts: string[] = [];
  if (overdue.length > 0) subParts.push(`${overdue.length} needs landlord`);
  if (tenantToUpload.length > 0) subParts.push(`${tenantToUpload.length} for you to upload`);
  const subline = subParts.length > 0 ? subParts.join(" · ") : "all current";

  const handleNudge = (item: OverdueLandlordDoc) => {
    onNudgeLandlord({ propId: property.id, docName: item.docName });
    toast.success("Nudge sent to David", {
      description: `We let David know the ${displayName(item.docName).toLowerCase()} is overdue.`,
    });
  };

  const handleRaiseFormally = (item: OverdueLandlordDoc) => {
    onNudgeLandlord({ propId: property.id, docName: item.docName, formal: true });
    toast.success("Formal request logged", {
      description: `${displayName(item.docName)} flagged as a formal escalation.`,
    });
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between" style={{ marginBottom: "1rem" }}>
        <div>
          <p className="text-foreground" style={{ fontSize: "16px", fontWeight: 500 }}>
            {filedCount} {filedNoun} filed
          </p>
          <p
            className="text-muted-foreground"
            style={{ fontSize: "12px", marginTop: "2px" }}
          >
            {subline}
          </p>
        </div>

        <div className="relative">
          <span
            className="absolute"
            style={{
              left: "10px", top: "50%", transform: "translateY(-50%)",
              fontSize: "12px", color: "hsl(var(--muted-foreground) / 0.7)",
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
      </div>

      {/* 1. Waiting on your landlord */}
      {overdue.length > 0 && (
        <>
          <p
            className="font-medium"
            style={{
              fontSize: "12px", color: RED_HEAD,
              letterSpacing: "0.5px", textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            Waiting on your landlord
          </p>

          <div style={{ marginBottom: "1.5rem" }}>
            {overdue.map((item, i) => (
              <div
                key={item.docName}
                style={{
                  backgroundColor: RED_BG,
                  border: `0.5px solid ${RED_BORDER}`,
                  borderRadius: "12px",
                  padding: "14px 16px",
                  marginBottom: i < overdue.length - 1 ? "10px" : 0,
                }}
              >
                <p
                  className="font-medium"
                  style={{ fontSize: "13px", color: RED_HEAD }}
                >
                  {displayName(item.docName)}
                </p>
                <p
                  style={{
                    fontSize: "12px", color: RED_SUB,
                    marginTop: "4px", lineHeight: 1.4,
                  }}
                >
                  {item.deadlineBreach}
                </p>

                <div
                  style={{
                    backgroundColor: RED_INSET_BG,
                    borderRadius: "8px",
                    padding: "8px 10px",
                    marginTop: "10px",
                  }}
                >
                  <p
                    className="font-medium"
                    style={{
                      fontSize: "10px", color: RED_HEAD,
                      textTransform: "uppercase", letterSpacing: "0.4px",
                      marginBottom: "3px",
                    }}
                  >
                    Why this matters
                  </p>
                  <p style={{ fontSize: "12px", color: RED_SUB, lineHeight: 1.4 }}>
                    {item.whyThisMatters}
                  </p>
                </div>

                <div
                  className="flex items-center"
                  style={{ gap: "8px", marginTop: "12px" }}
                >
                  <button
                    onClick={() => handleNudge(item)}
                    className="font-medium"
                    style={{
                      backgroundColor: RED_HEAD,
                      color: "#FFFFFF",
                      fontSize: "12px",
                      padding: "7px 14px",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    Nudge David
                  </button>
                  <button
                    onClick={() => handleRaiseFormally(item)}
                    style={{
                      backgroundColor: "#FFFFFF",
                      color: "hsl(var(--foreground))",
                      fontSize: "12px",
                      padding: "7px 14px",
                      border: `0.5px solid ${BUTTON_BORDER}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    Raise formally
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 2. For you to upload */}
      {tenantToUpload.length > 0 && (
        <>
          <div className="flex items-baseline justify-between" style={{ marginBottom: "10px" }}>
            <p
              className="font-medium text-muted-foreground"
              style={{
                fontSize: "12px",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              For you to upload
            </p>
            <button
              onClick={onSwitchToTasks}
              style={{
                fontSize: "11px",
                color: "hsl(var(--muted-foreground) / 0.7)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              Managed via Tasks →
            </button>
          </div>

          <div
            className="bg-card hairline rounded-xl"
            style={{ padding: "4px 0", marginBottom: "1.5rem" }}
          >
            {tenantToUpload.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between"
                style={{ padding: "10px 16px" }}
              >
                <div className="min-w-0">
                  <p className="text-foreground" style={{ fontSize: "13px" }}>
                    {displayName(doc.name)}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "hsl(var(--muted-foreground) / 0.7)",
                      marginTop: "1px",
                    }}
                  >
                    {doc.desc}
                  </p>
                </div>
                <button
                  onClick={onSwitchToTasks}
                  style={{
                    fontSize: "12px",
                    color: PURPLE,
                    fontWeight: 500,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Upload →
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 3. Filed & current */}
      {filedCount > 0 && (
        <>
          <div className="flex items-baseline justify-between" style={{ marginBottom: "10px" }}>
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
            <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground) / 0.7)" }}>
              {filedCount} {filedNoun}
            </span>
          </div>

          <div className="bg-card hairline rounded-xl" style={{ padding: "4px 0" }}>
            {filed.map((doc) => {
              const facts = extractedFacts[`${property.id}::${doc.name}`];
              const subtitle = facts?.summary ?? doc.desc ?? "On file";
              const hasSparkle = !!facts;
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3"
                  style={{ padding: "10px 16px" }}
                >
                  <div className="min-w-0">
                    <p className="text-foreground" style={{ fontSize: "13px" }}>
                      {displayName(doc.name)}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "hsl(var(--muted-foreground) / 0.7)",
                        marginTop: "1px",
                      }}
                    >
                      {subtitle}
                      {hasSparkle && <> <Sparkle /></>}
                    </p>
                  </div>
                  <span
                    className="shrink-0"
                    style={{
                      fontSize: "12px",
                      color: "hsl(var(--muted-foreground) / 0.7)",
                    }}
                  >
                    View →
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {overdue.length === 0 && tenantToUpload.length === 0 && filedCount === 0 && (
        <div className="bg-card hairline rounded-xl p-8 text-center">
          <p className="text-[13px] text-muted-foreground">No documents on file yet.</p>
        </div>
      )}
    </div>
  );
}
