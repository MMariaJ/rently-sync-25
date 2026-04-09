import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Check, Clock, FileText, Eye, Search,
  ChevronDown, X, Shield, Camera, Flame, Zap,
  Home, AlertTriangle,
} from "lucide-react";
import {
  VAULT_INIT, DOC_VALIDITY_BY_PROP,
  type Property, type VaultDoc,
} from "@/data/constants";

interface VaultTabProps {
  property: Property;
  allVaults: Record<string, VaultDoc[]>;
}

// Document categories with icons
const DOC_CATEGORIES: { key: string; label: string; icon: typeof FileText; docs: string[] }[] = [
  {
    key: "safety",
    label: "Safety & Compliance",
    icon: Shield,
    docs: ["Gas Safety Certificate", "EPC Certificate", "EICR Report", "Smoke & CO Alarm Evidence"],
  },
  {
    key: "tenancy",
    label: "Tenancy & Legal",
    icon: FileText,
    docs: ["Tenancy Agreement (AST)", "How to Rent Guide", "Deposit Protection Certificate", "HMO Licence"],
  },
  {
    key: "inventory",
    label: "Inventory & Photos",
    icon: Camera,
    docs: ["Move-In Inventory", "Move-In Photos", "Move-Out Photos", "Meter Reading Photos", "Move-Out Photos"],
  },
];

export function VaultTab({ property: p, allVaults }: VaultTabProps) {
  const vault = allVaults[p.id] || VAULT_INIT;
  const docValidity = DOC_VALIDITY_BY_PROP[p.id] || {};

  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    // Auto-expand groups that have action-needed documents
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

  // Categorize
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

  // Uncategorized docs
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Progress bar — subtle, integrated */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground">Document vault</span>
          <span className="text-[11px] text-muted-foreground font-medium">{totalUploaded}/{vault.length} uploaded</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", progressPct === 100 ? "bg-success" : "bg-primary")}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-8 py-2.5 rounded-lg bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Grouped documents */}
      <div className="space-y-2">
        {categorized.map(cat => {
          const Icon = cat.icon;
          const isOpen = expandedGroups[cat.key] ?? false;

          return (
            <div key={cat.key} className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Group header — always visible */}
              <button
                onClick={() => toggleGroup(cat.key)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/20 transition-colors"
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  cat.actionCount > 0 ? "bg-warning/10 text-warning" : "bg-success-muted text-success"
                )}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-foreground">{cat.label}</span>
                </div>

                {/* Mini status */}
                <div className="flex items-center gap-2 shrink-0">
                  {cat.actionCount > 0 && (
                    <span className="text-[9px] font-semibold text-warning bg-warning-muted rounded-full px-1.5 py-0.5">
                      {cat.actionCount} action{cat.actionCount > 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">{cat.uploaded}/{cat.total}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground/40 transition-transform", isOpen && "rotate-180")} />
                </div>
              </button>

              {/* Expanded docs */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border divide-y divide-border/50">
                      {cat.docs.map(doc => (
                        <DocRow key={doc.id} doc={doc} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Uncategorized */}
        {uncategorized.length > 0 && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <span className="text-xs font-semibold text-foreground">Other Documents</span>
            </div>
            <div className="divide-y divide-border/50">
              {uncategorized.map(doc => {
                const validity = docValidity[doc.name];
                const isUploaded = doc.status === "uploaded";
                return (
                  <DocRow key={doc.id} doc={{ ...doc, validity, isUploaded, needsAction: !isUploaded }} />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Upload additional */}
      <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-border hover:border-primary/30 text-muted-foreground hover:text-foreground transition-colors text-xs font-medium">
        <Upload className="w-3.5 h-3.5" /> Upload additional document
      </button>
    </motion.div>
  );
}

/* ─── Single document row ─── */
function DocRow({ doc }: { doc: any }) {
  const isLandlordDoc = doc.owner === "landlord" || doc.owner === "both";

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2.5 transition-colors",
      doc.needsAction ? "bg-warning/3" : ""
    )}>
      {/* Status dot */}
      <div className={cn(
        "w-1.5 h-1.5 rounded-full shrink-0",
        doc.needsAction
          ? doc.validity?.status === "expired" ? "bg-danger" : !doc.isUploaded ? "bg-border" : "bg-warning"
          : "bg-success"
      )} />

      {/* Name + validity */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-[11px] font-medium text-foreground truncate">{doc.name}</span>
        {doc.validity && doc.isUploaded && (
          <span className={cn(
            "text-[8px] font-semibold rounded-full px-1.5 py-0.5 shrink-0",
            doc.validity.status === "valid" ? "text-success bg-success-muted" :
            doc.validity.status === "expiring" ? "text-warning bg-warning-muted" :
            "text-danger bg-danger-muted"
          )}>
            {doc.validity.status === "valid" ? `${doc.validity.days}d` :
             doc.validity.status === "expiring" ? `${doc.validity.days}d` :
             "Expired"}
          </span>
        )}
      </div>

      {/* Action */}
      {doc.isUploaded ? (
        <button className="flex items-center gap-1 px-2 py-1 rounded-md text-foreground text-[10px] font-medium hover:bg-secondary/50 transition-colors shrink-0">
          <Eye className="w-3 h-3" /> View
        </button>
      ) : isLandlordDoc ? (
        <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-medium shrink-0 hover:opacity-90">
          <Upload className="w-3 h-3" /> Upload
        </button>
      ) : (
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
          <Clock className="w-3 h-3" /> Awaiting
        </span>
      )}
    </div>
  );
}
