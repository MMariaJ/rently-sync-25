// Property-driven Vault tab.
// Same three-section design as the Elmwood spec, generalized:
//   1. Needs attention  — expired documents
//   2. Still to collect — landlord docs not yet filed
//   3. Filed & current  — uploaded docs, with inline amber for expiring soon
//
// Data sources:
//   - VAULT_INIT + Index.tsx prefilled vaults → what's filed per property
//   - DOC_VALIDITY_BY_PROP → expiry dates and status per document

import { useState } from "react";
import { toast } from "sonner";
import {
  DOC_VALIDITY_BY_PROP, VAULT_INIT,
  type Property, type VaultDoc, type DocValidity,
} from "@/data/constants";
import { extractFactsFor } from "@/state/engines";

const PURPLE = "#534AB7";

// Red — Needs attention
const RED_LABEL = "#791F1F";
const RED_BG = "#FDF6F5";
const RED_BORDER = "#E24B4A";
const RED_DIVIDER = "#F7C1C1";
const RED_PILL_TEXT = "#A32D2D";
const RED_PILL_BG = "#FCEBEB";

// Amber — Expiring soon (≤ 60 days)
const AMBER_BG = "#FFFAEE";
const AMBER_TEXT = "#854F0B";

const EXPIRING_THRESHOLD_DAYS = 60;

const Sparkle = () => <span style={{ color: PURPLE }}>✦</span>;

interface LifecycleVaultTabProps {
  property: Property;
  allVaults: Record<string, VaultDoc[]>;
  extractedFacts?: Record<string, import("@/state/engines").ExtractedFacts>;
  onUploadDocDirect?: (propId: string, vaultDoc: string, filename?: string) => void;
}

// Documents the AI extracts from (these get the ✦ sparkle)
const EXTRACTED_DOCS = new Set([
  "Tenancy Agreement (AST)",
  "Gas Safety Certificate",
  "EPC Certificate",
  "EICR Report",
  "Deposit Protection Certificate",
  "Move-In Inventory",
  "HMO Licence",
]);

// Friendly display name (the row title)
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
};

// Categorise still-to-collect docs into the three buckets
const COLLECT_GROUPS: { label: string; docs: string[] }[] = [
  { label: "Safety & compliance", docs: ["Gas Safety Certificate", "EPC Certificate", "EICR Report"] },
  { label: "Tenancy & legal", docs: ["Tenancy Agreement (AST)", "How to Rent Guide", "Deposit Protection Certificate", "HMO Licence"] },
  { label: "Utilities & setup", docs: ["Move-In Inventory", "Move-In Photos", "Move-Out Photos"] },
];

// Build a synthetic filename for a filed document (display only)
function syntheticFilename(docName: string, propAddress: string): string {
  const slug = propAddress.split(",")[0].replace(/\s+/g, "");
  const year = new Date().getFullYear();
  const map: Record<string, string> = {
    "Tenancy Agreement (AST)": `AST_${slug}_${year}.pdf`,
    "Gas Safety Certificate": `GasSafety_${slug}_${year}.pdf`,
    "EPC Certificate": `EPC_${slug}_${year}.pdf`,
    "EICR Report": `EICR_${slug}_${year}.pdf`,
    "Deposit Protection Certificate": `Deposit_${slug}.pdf`,
    "Move-In Inventory": `Inventory_${slug}.pdf`,
    "HMO Licence": `HMOLicence_${slug}.pdf`,
  };
  return map[docName] ?? `${docName.replace(/\s+/g, "_")}.pdf`;
}

// EPC-specific extracted summary line
function epcContext(): string {
  return "Rating D (62) · issued 14 Apr 2016 · valid 10 years";
}

// Generic extracted summary for a filed doc
function extractedSummary(docName: string, validity: DocValidity | undefined): string {
  if (docName === "EPC Certificate") return epcContext();
  if (docName === "Tenancy Agreement (AST)") {
    return validity ? `Renews ${validity.expiry}` : "12-month assured shorthold tenancy";
  }
  if (docName === "Gas Safety Certificate") {
    return validity ? `Expires ${validity.expiry}` : "Annual landlord gas safety record";
  }
  if (docName === "EICR Report") {
    return validity ? `Valid until ${validity.expiry}` : "5-yearly electrical installation report";
  }
  if (docName === "Deposit Protection Certificate") {
    return "Protected · prescribed information served";
  }
  if (docName === "Move-In Inventory") {
    return "Photographs and signed inventory";
  }
  return "On file";
}

// Format the right-side label on a Filed row
function rightLabelFor(validity: DocValidity | undefined): { label: string; amber: boolean } {
  if (validity?.status === "expiring") return { label: "Renew soon →", amber: true };
  return { label: "View →", amber: false };
}

// Subtitle on a Filed row
function filedSubtitle(docName: string, validity: DocValidity | undefined, doc: VaultDoc): string {
  if (validity?.status === "expiring" && validity.days > 0) {
    return `Expires in ${validity.days} days ·`;
  }
  if (docName === "Tenancy Agreement (AST)" && validity) {
    return `Renews ${validity.expiry} ·`;
  }
  if (docName === "Move-In Inventory" && doc.timestamp) {
    return `28 photos · ${doc.timestamp.split(" ").slice(0, 2).join(" ")} ·`;
  }
  if (validity) {
    return `Valid until ${validity.expiry} ·`;
  }
  if (doc.timestamp) {
    return `Reference · uploaded ${doc.timestamp.split(" ").slice(0, 2).join(" ")}`;
  }
  return "On file";
}

export function LifecycleVaultTab({ property, allVaults, extractedFacts, onUploadDocDirect }: LifecycleVaultTabProps) {
  const vault = allVaults[property.id] ?? VAULT_INIT;
  const validity = DOC_VALIDITY_BY_PROP[property.id] ?? {};
  const isHmo = !!property.isHmo;

  // For overdue renewals, show the AI-extracted facts inline in the red card
  // and require the landlord to confirm before we file the doc. Keeps the
  // key facts anchored to the upload rather than flashing past in a toast.
  const [pendingRenewal, setPendingRenewal] = useState<string | null>(null);

  const handleUpload = (docName: string) => {
    onUploadDocDirect?.(property.id, docName);
    toast.success("Uploaded · filed in Vault", {
      description: `${docName} added to this property's record.`,
    });
  };

  const handleConfirmRenewal = (docName: string) => {
    onUploadDocDirect?.(property.id, docName);
    setPendingRenewal(null);
    toast.success("Renewal filed", {
      description: `${docName} confirmed and filed in Vault.`,
    });
  };

  // Filter HMO licence visibility
  const allDocsForProp = vault.filter((d) => isHmo || d.name !== "HMO Licence");

  // Buckets. A "Just now" timestamp means the landlord just re-uploaded —
  // treat that as a renewal regardless of the static validity record.
  const isFreshRenewal = (d: VaultDoc) => d.timestamp === "Just now";
  const filed = allDocsForProp.filter((d) => d.status === "uploaded");
  const filedNonExpired = filed.filter(
    (d) => validity[d.name]?.status !== "expired" || isFreshRenewal(d),
  );
  // For p2 and p3, surface "Renew soon" docs at the top of Filed & current
  if (property.id === "p2" || property.id === "p3") {
    filedNonExpired.sort((a, b) => {
      const aExpiring = validity[a.name]?.status === "expiring" ? 0 : 1;
      const bExpiring = validity[b.name]?.status === "expiring" ? 0 : 1;
      return aExpiring - bExpiring;
    });
  }
  const expired = filed.filter(
    (d) => validity[d.name]?.status === "expired" && !isFreshRenewal(d),
  );

  const filedNames = new Set(filed.map((d) => d.name));
  // Still to collect = landlord-owned docs that aren't filed yet
  const toCollect = allDocsForProp.filter(
    (d) => d.status !== "uploaded" && (d.owner === "landlord" || d.owner === "both")
  );
  const toCollectNames = new Set(toCollect.map((d) => d.name));

  const headerSubline = `${expired.length > 0 ? `${expired.length} needs your attention · ` : ""}${toCollect.length} still to collect`;

  return (
    <div className="animate-fade-in">
      {/* Header row */}
      <div className="flex items-end justify-between" style={{ marginBottom: "1rem" }}>
        <div>
          <p className="text-foreground" style={{ fontSize: "16px", fontWeight: 500 }}>
            {filed.length} {filed.length === 1 ? "document" : "documents"} filed
          </p>
          <p
            className="text-muted-foreground"
            style={{ fontSize: "12px", marginTop: "2px" }}
          >
            {headerSubline}
          </p>
        </div>

        <div className="flex items-center" style={{ gap: "8px" }}>
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
          <button
            onClick={() => {
              const next = toCollect[0]?.name;
              if (next) handleUpload(next);
            }}
            className="text-foreground"
            style={{
              padding: "6px 12px",
              fontSize: "13px",
              backgroundColor: "hsl(var(--card))",
              border: "0.5px solid hsl(var(--muted-foreground) / 0.3)",
              borderRadius: "8px",
              cursor: toCollect.length > 0 ? "pointer" : "not-allowed",
              opacity: toCollect.length > 0 ? 1 : 0.5,
            }}
            disabled={toCollect.length === 0}
            title={toCollect[0]?.name ? `Upload ${toCollect[0]?.name}` : "Nothing to upload"}
          >
            + Upload
          </button>
        </div>
      </div>

      {/* 1. Needs attention */}
      {expired.length > 0 && (
        <>
          <p
            className="font-medium"
            style={{
              fontSize: "12px", color: RED_LABEL,
              letterSpacing: "0.5px", textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            Needs attention
          </p>

          <div style={{ marginBottom: "1.5rem" }}>
            {expired.map((doc, i) => {
              const v = validity[doc.name];
              const daysOverdue = v ? Math.abs(v.days) : 0;
              const filename = syntheticFilename(doc.name, property.address);
              const isPending = pendingRenewal === doc.name;
              const previewFacts = isPending ? extractFactsFor(property.id, doc.name) : null;
              return (
                <div
                  key={doc.id}
                  style={{
                    backgroundColor: RED_BG,
                    border: `0.5px solid ${RED_BORDER}`,
                    borderRadius: "12px",
                    padding: "14px 16px",
                    marginBottom: i < expired.length - 1 ? "10px" : 0,
                  }}
                >
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
                        {DISPLAY_NAME[doc.name] ?? doc.name}
                        {EXTRACTED_DOCS.has(doc.name) && <> · <Sparkle /></>}
                      </p>
                      <p className="text-foreground" style={{ fontSize: "14px", fontWeight: 500 }}>
                        {filename}
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
                      Expired {daysOverdue} {daysOverdue === 1 ? "day" : "days"} ago
                    </span>
                  </div>

                  {isPending && previewFacts ? (
                    <div
                      style={{
                        paddingTop: "12px",
                        borderTop: `0.5px solid ${RED_DIVIDER}`,
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "#F7F5FD",
                          border: `0.5px solid ${PURPLE}33`,
                          borderRadius: "8px",
                          padding: "12px 14px",
                          marginBottom: "12px",
                        }}
                      >
                        <p
                          className="font-medium"
                          style={{
                            fontSize: "11px",
                            color: PURPLE,
                            letterSpacing: "0.3px",
                            textTransform: "uppercase",
                            marginBottom: "6px",
                          }}
                        >
                          ✦ Key facts captured
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "hsl(var(--foreground))",
                            lineHeight: 1.5,
                            marginBottom: previewFacts.fields && Object.keys(previewFacts.fields).length > 0 ? "8px" : 0,
                          }}
                        >
                          {previewFacts.summary}
                        </p>
                        {previewFacts.fields && Object.keys(previewFacts.fields).length > 0 && (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
                            {Object.entries(previewFacts.fields).map(([k, val]) => (
                              <div key={k} className="flex items-center justify-between gap-2" style={{ fontSize: "12px" }}>
                                <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                                <span className="text-foreground tabular-nums text-right truncate">{val}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <p
                          className="text-muted-foreground"
                          style={{ fontSize: "11px", lineHeight: 1.5, marginTop: "8px" }}
                        >
                          Check these details match the new certificate, then confirm to file.
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPendingRenewal(null)}
                          className="text-muted-foreground"
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            backgroundColor: "transparent",
                            border: "0.5px solid hsl(var(--muted-foreground) / 0.3)",
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleConfirmRenewal(doc.name)}
                          className="font-medium text-white"
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            backgroundColor: PURPLE,
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                        >
                          Confirm & file
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-between gap-3"
                      style={{ paddingTop: "10px", borderTop: `0.5px solid ${RED_DIVIDER}` }}
                    >
                      <p className="text-muted-foreground min-w-0" style={{ fontSize: "12px" }}>
                        {extractedFacts?.[`${property.id}::${doc.name}`]?.summary ?? extractedSummary(doc.name, v)}
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
                          onClick={() => setPendingRenewal(doc.name)}
                          className="font-medium text-white"
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            backgroundColor: PURPLE,
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                        >
                          Renew →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 2. Still to collect */}
      {toCollect.length > 0 && (
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
              Still to collect
            </p>
            <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground) / 0.7)" }}>
              Managed via Tasks →
            </span>
          </div>

          <div
            className="bg-card hairline rounded-xl"
            style={{ padding: "4px 0", marginBottom: "1.5rem" }}
          >
            {COLLECT_GROUPS.map((group) => {
              const items = group.docs.filter((d) => toCollectNames.has(d));
              if (items.length === 0) return null;
              return (
                <CollectGroup
                  key={group.label}
                  label={group.label}
                  items={items}
                  onUpload={(name) => handleUpload(name)}
                />
              );
            })}
          </div>
        </>
      )}

      {/* 3. Filed & current */}
      {filedNonExpired.length > 0 && (
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
              {filedNonExpired.length} {filedNonExpired.length === 1 ? "document" : "documents"}
            </span>
          </div>

          <div className="bg-card hairline rounded-xl" style={{ padding: "4px 0" }}>
            {filedNonExpired.map((doc) => {
              const v = validity[doc.name];
              const isExpiring = v?.status === "expiring" && v.days <= EXPIRING_THRESHOLD_DAYS;
              const right = rightLabelFor(v);
              const subtitle = filedSubtitle(doc.name, v, doc);
              const hasSparkle = EXTRACTED_DOCS.has(doc.name);
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3"
                  style={{
                    padding: "10px 16px",
                    backgroundColor: isExpiring ? AMBER_BG : undefined,
                  }}
                >
                  <div className="min-w-0">
                    <p className="text-foreground" style={{ fontSize: "13px" }}>
                      {DISPLAY_NAME[doc.name] ?? doc.name}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: isExpiring ? AMBER_TEXT : "hsl(var(--muted-foreground) / 0.7)",
                        marginTop: "1px",
                      }}
                    >
                      {extractedFacts?.[`${property.id}::${doc.name}`]?.summary ?? subtitle}
                      {hasSparkle && <> <Sparkle /></>}
                    </p>
                  </div>
                  <span
                    className="shrink-0"
                    style={{
                      fontSize: "12px",
                      color: right.amber ? AMBER_TEXT : "hsl(var(--muted-foreground) / 0.7)",
                      fontWeight: right.amber ? 500 : 400,
                    }}
                  >
                    {right.label}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {expired.length === 0 && toCollect.length === 0 && filedNonExpired.length === 0 && (
        <div className="bg-card hairline rounded-xl p-8 text-center">
          <p className="text-[13px] text-muted-foreground">No documents on file yet.</p>
        </div>
      )}

      {/* Suppress unused import warning */}
      <span style={{ display: "none" }}>{filedNames.size}</span>
    </div>
  );
}

function CollectGroup({ label, items, onUpload }: { label: string; items: string[]; onUpload?: (name: string) => void }) {
  return (
    <div className="[&:not(:first-child)]:hairline-t" style={{ marginTop: 0 }}>
      <p
        style={{
          fontSize: "11px",
          color: "hsl(var(--muted-foreground) / 0.7)",
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          padding: "10px 16px 4px 16px",
        }}
      >
        {label}
      </p>
      {items.map((item) => (
        <div
          key={item}
          className="flex items-center justify-between"
          style={{ padding: "8px 16px" }}
        >
          <span className="text-foreground" style={{ fontSize: "13px" }}>
            {DISPLAY_NAME[item] ?? item}
          </span>
          <button
            onClick={() => onUpload?.(item)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            style={{ fontSize: "12px", background: "transparent", border: "none", cursor: "pointer" }}
          >
            Upload →
          </button>
        </div>
      ))}
    </div>
  );
}
