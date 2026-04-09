import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Check, Clock, FileText, Eye, Search,
  AlertTriangle, ChevronDown, Filter, X,
} from "lucide-react";
import {
  VAULT_INIT, DOC_VALIDITY_BY_PROP,
  type Property, type VaultDoc,
} from "@/data/constants";

interface VaultTabProps {
  property: Property;
  allVaults: Record<string, VaultDoc[]>;
}

type DocFilter = "all" | "action" | "uploaded" | "pending";

export function VaultTab({ property: p, allVaults }: VaultTabProps) {
  const vault = allVaults[p.id] || VAULT_INIT;
  const docValidity = DOC_VALIDITY_BY_PROP[p.id] || {};

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DocFilter>("all");
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  // Categorize documents
  const categorized = useMemo(() => {
    return vault.map(doc => {
      const validity = docValidity[doc.name];
      const isUploaded = doc.status === "uploaded";
      const needsAction = isUploaded && validity && (validity.status === "expiring" || validity.status === "expired");
      const priority = needsAction ? (validity!.status === "expired" ? 0 : 1) : isUploaded ? 3 : 2;
      return { ...doc, validity, isUploaded, needsAction, priority };
    }).sort((a, b) => a.priority - b.priority);
  }, [vault, docValidity]);

  // Filter and search
  const filtered = useMemo(() => {
    return categorized.filter(doc => {
      if (search && !doc.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === "action") return doc.needsAction || !doc.isUploaded;
      if (filter === "uploaded") return doc.isUploaded && !doc.needsAction;
      if (filter === "pending") return !doc.isUploaded;
      return true;
    });
  }, [categorized, search, filter]);

  const actionCount = categorized.filter(d => d.needsAction || !d.isUploaded).length;
  const uploadedCount = categorized.filter(d => d.isUploaded).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Compact summary strip */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
          <FileText className="w-3 h-3" /> {vault.length} documents
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-muted text-success text-[10px] font-semibold">
          <Check className="w-3 h-3" /> {uploadedCount} uploaded
        </span>
        {actionCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning-muted text-warning text-[10px] font-semibold">
            <AlertTriangle className="w-3 h-3" /> {actionCount} need attention
          </span>
        )}
      </div>

      {/* Search and filter bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-2 rounded-lg bg-secondary/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 p-0.5 bg-secondary/50 rounded-lg">
          {([
            { key: "all", label: "All" },
            { key: "action", label: "Action needed" },
            { key: "uploaded", label: "Complete" },
            { key: "pending", label: "Pending" },
          ] as { key: DocFilter; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "text-[10px] font-medium px-2.5 py-1.5 rounded-md transition-all",
                filter === f.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs font-medium text-muted-foreground">No documents match your search</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((doc) => {
              const isLandlordDoc = doc.owner === "landlord" || doc.owner === "both";
              const isExpanded = expandedDoc === doc.id;

              return (
                <div key={doc.id}>
                  <button
                    onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
                      doc.needsAction ? "bg-warning/5" : ""
                    )}
                  >
                    {/* Status indicator */}
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      doc.needsAction
                        ? doc.validity?.status === "expired" ? "bg-danger" : "bg-warning"
                        : doc.isUploaded ? "bg-success" : "bg-border"
                    )} />

                    {/* Name + validity inline */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground truncate">{doc.name}</span>
                      {doc.validity && doc.isUploaded && (
                        <span className={cn(
                          "text-[9px] font-semibold rounded-full px-1.5 py-0.5 shrink-0",
                          doc.validity.status === "valid" ? "text-success bg-success-muted" :
                          doc.validity.status === "expiring" ? "text-warning bg-warning-muted" :
                          "text-danger bg-danger-muted"
                        )}>
                          {doc.validity.status === "valid" ? `${doc.validity.days}d` :
                           doc.validity.status === "expiring" ? `${doc.validity.days}d left` :
                           "Expired"}
                        </span>
                      )}
                    </div>

                    {/* Owner */}
                    <span className={cn(
                      "text-[9px] font-medium shrink-0",
                      doc.owner === "landlord" ? "text-primary" :
                      doc.owner === "tenant" ? "text-tenant" : "text-muted-foreground"
                    )}>
                      {doc.owner === "landlord" ? "You" : doc.owner === "tenant" ? "Tenant" : "Either"}
                    </span>

                    {/* Action */}
                    {doc.isUploaded ? (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-foreground text-[10px] font-medium shrink-0">
                        <Eye className="w-3 h-3" /> View
                      </span>
                    ) : isLandlordDoc ? (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-medium shrink-0">
                        <Upload className="w-3 h-3" /> Upload
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                        <Clock className="w-3 h-3" /> Awaiting
                      </span>
                    )}

                    <ChevronDown className={cn(
                      "w-3 h-3 text-muted-foreground/40 shrink-0 transition-transform",
                      isExpanded && "rotate-180"
                    )} />
                  </button>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3 pl-9 space-y-2">
                          <p className="text-[11px] text-muted-foreground">{doc.desc}</p>
                          {doc.isUploaded && doc.timestamp && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Uploaded {doc.timestamp}
                            </p>
                          )}
                          {doc.validity && doc.isUploaded && (
                            <p className="text-[10px] text-muted-foreground">
                              Expires: {doc.validity.expiry}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload additional — compact */}
      <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-border hover:border-primary/30 text-muted-foreground hover:text-foreground transition-colors text-xs font-medium">
        <Upload className="w-3.5 h-3.5" />
        Upload additional document
      </button>
    </motion.div>
  );
}
