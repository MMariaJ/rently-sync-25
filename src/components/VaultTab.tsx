import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import {
  Upload, Clock, FileText, Eye, Search,
  ChevronDown, X,
} from "lucide-react";
import {
  VAULT_INIT, DOC_VALIDITY_BY_PROP,
  type Property, type VaultDoc,
} from "@/data/constants";

interface VaultTabProps {
  property: Property;
  allVaults: Record<string, VaultDoc[]>;
}

const DOC_CATEGORIES: { key: string; label: string; docs: string[] }[] = [
  {
    key: "safety",
    label: "Safety & compliance",
    docs: ["Gas Safety Certificate", "EPC Certificate", "EICR Report", "Smoke & CO Alarm Evidence"],
  },
  {
    key: "tenancy",
    label: "Tenancy & legal",
    docs: ["Tenancy Agreement (AST)", "How to Rent Guide", "Deposit Protection Certificate", "HMO Licence"],
  },
  {
    key: "inventory",
    label: "Inventory & photos",
    docs: ["Move-In Inventory", "Move-In Photos", "Move-Out Photos", "Meter Reading Photos"],
  },
];

export function VaultTab({ property: p, allVaults }: VaultTabProps) {
  const vault = allVaults[p.id] || VAULT_INIT;
  const docValidity = DOC_VALIDITY_BY_PROP[p.id] || {};

  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    DOC_CATEGORIES.forEach(cat => {
      const catDocs = vault.filter(d => cat.docs.includes(d.name));
      const hasAction = catDocs.some(d => {
        if (d.status !== "uploaded") return true;
        const v = docValidity[d.name];
        return v && (v.status === "expiring" || v.status === "expired");
      });
      init[cat.key] = hasAction;
    });
    return init;
  });

  const categorized = useMemo(() => {
    return DOC_CATEGORIES.map(cat => {
      const docs = vault
        .filter(d => cat.docs.includes(d.name))
        .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()))
        .map(doc => {
          const validity = docValidity[doc.name];
          const isUploaded = doc.status === "uploaded";
          const needsAction = !isUploaded || (validity && (validity.status === "expiring" || validity.status === "expired"));
          return { ...doc, validity, isUploaded, needsAction: !!needsAction };
        })
        .sort((a, b) => (a.needsAction === b.needsAction ? 0 : a.needsAction ? -1 : 1));

      const actionCount = docs.filter(d => d.needsAction).length;
      const total = docs.length;
      const uploaded = docs.filter(d => d.isUploaded).length;

      return { ...cat, docs, actionCount, total, uploaded };
    }).filter(cat => cat.docs.length > 0);
  }, [vault, docValidity, search]);

  const allCategorized = DOC_CATEGORIES.flatMap(c => c.docs);
  const uncategorized = vault
    .filter(d => !allCategorized.includes(d.name))
    .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()));

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const totalUploaded = vault.filter(d => d.status === "uploaded").length;
  const progressPct = vault.length > 0 ? Math.round((totalUploaded / vault.length) * 100) : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="bg-card hairline rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="label-eyebrow">Document vault</p>
          <span className="text-[12px] text-muted-foreground tabular-nums">{totalUploaded}/{vault.length} uploaded</span>
        </div>
        <div className="h-[3px] bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search documents…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-card hairline text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {categorized.map(cat => {
          const isOpen = expandedGroups[cat.key] ?? false;
          return (
            <div key={cat.key} className="bg-card hairline rounded-xl overflow-hidden">
              <button
                onClick={() => toggleGroup(cat.key)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-secondary/40 transition-colors"
              >
                <span className="text-[13px] text-foreground font-medium flex-1">{cat.label}</span>
                <div className="flex items-center gap-3 shrink-0 text-[12px] tabular-nums">
                  {cat.actionCount > 0 && (
                    <span className="text-danger">
                      {cat.actionCount} action{cat.actionCount > 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="text-muted-foreground">{cat.uploaded}/{cat.total}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </div>
              </button>

              {isOpen && (
                <div className="hairline-t">
                  {cat.docs.map((doc, idx) => (
                    <DocRow key={doc.id} doc={doc} divider={idx > 0} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {uncategorized.length > 0 && (
          <div className="bg-card hairline rounded-xl overflow-hidden">
            <div className="px-4 py-3 hairline-b">
              <span className="text-[13px] text-foreground font-medium">Other documents</span>
            </div>
            {uncategorized.map((doc, idx) => {
              const validity = docValidity[doc.name];
              const isUploaded = doc.status === "uploaded";
              return (
                <DocRow key={doc.id} doc={{ ...doc, validity, isUploaded, needsAction: !isUploaded }} divider={idx > 0} />
              );
            })}
          </div>
        )}
      </div>

      <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-[0.5px] border-dashed border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-colors text-[13px]">
        <Upload className="w-3.5 h-3.5" /> Upload additional document
      </button>
    </div>
  );
}

function DocRow({ doc, divider }: { doc: any; divider?: boolean }) {
  const isLandlordDoc = doc.owner === "landlord" || doc.owner === "both";
  const validityLabel = doc.validity && doc.isUploaded
    ? doc.validity.status === "expired" ? "Expired" : `${doc.validity.days}d`
    : null;
  const validityTone =
    doc.validity?.status === "expired" ? "text-danger"
    : doc.validity?.status === "expiring" ? "text-warning"
    : "text-muted-foreground";

  return (
    <div className={cn("flex items-center gap-3 px-4 py-2.5", divider && "hairline-t")}>
      <div className={cn(
        "w-1.5 h-1.5 rounded-full shrink-0",
        doc.needsAction
          ? doc.validity?.status === "expired" ? "bg-danger" : !doc.isUploaded ? "bg-border" : "bg-warning"
          : "bg-foreground/30"
      )} />

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-[13px] text-foreground truncate">{doc.name}</span>
        {validityLabel && (
          <span className={cn("text-[11px] tabular-nums shrink-0", validityTone)}>
            {validityLabel}
          </span>
        )}
      </div>

      {doc.isUploaded ? (
        <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-foreground text-[12px] hover:bg-secondary transition-colors shrink-0">
          <Eye className="w-3 h-3" /> View
        </button>
      ) : isLandlordDoc ? (
        <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium shrink-0 hover:opacity-90 transition-opacity">
          <Upload className="w-3 h-3" /> Upload
        </button>
      ) : (
        <span className="flex items-center gap-1 text-[12px] text-muted-foreground shrink-0">
          <Clock className="w-3 h-3" /> Awaiting
        </span>
      )}
    </div>
  );
}
