import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Upload, Check, Clock, Lock, FileText, Eye,
} from "lucide-react";
import {
  VAULT_INIT, DOC_VALIDITY_BY_PROP,
  type Property, type VaultDoc,
} from "@/data/constants";

interface VaultTabProps {
  property: Property;
  allVaults: Record<string, VaultDoc[]>;
}

export function VaultTab({ property: p, allVaults }: VaultTabProps) {
  const vault = allVaults[p.id] || VAULT_INIT;
  const docValidity = DOC_VALIDITY_BY_PROP[p.id] || {};
  const uploaded = vault.filter(d => d.status === "uploaded");
  const pending = vault.filter(d => d.status === "pending");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          label="Total Documents"
          value={vault.length.toString()}
          icon={<FileText className="w-4 h-4" />}
          color="text-primary"
          bg="bg-landlord-light"
        />
        <SummaryCard
          label="Uploaded"
          value={uploaded.length.toString()}
          icon={<Check className="w-4 h-4" />}
          color="text-success"
          bg="bg-success-muted"
        />
        <SummaryCard
          label="Pending"
          value={pending.length.toString()}
          icon={<Clock className="w-4 h-4" />}
          color={pending.length > 0 ? "text-warning" : "text-success"}
          bg={pending.length > 0 ? "bg-warning-muted" : "bg-success-muted"}
        />
      </div>

      {/* Document list */}
      <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-foreground">Required Documents</h3>
          <span className="text-xs text-muted-foreground">{uploaded.length} of {vault.length} uploaded</span>
        </div>

        <div className="divide-y divide-border">
          {vault.map((doc) => {
            const validity = docValidity[doc.name];
            const isUploaded = doc.status === "uploaded";
            const isLandlordDoc = doc.owner === "landlord" || doc.owner === "both";

            return (
              <div
                key={doc.id}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 transition-colors",
                  isUploaded ? "bg-success-muted/30" : "hover:bg-secondary/30"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  isUploaded ? "bg-success-muted" : "bg-secondary"
                )}>
                  {isUploaded ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-foreground">{doc.name}</span>
                    {validity && isUploaded && (
                      <span className={cn(
                        "text-[10px] font-semibold rounded-full px-2 py-0.5",
                        validity.status === "valid" ? "text-success bg-success-muted" :
                        validity.status === "expiring" ? "text-warning bg-warning-muted" :
                        "text-danger bg-danger-muted"
                      )}>
                        {validity.status === "valid" ? `Valid · ${validity.days}d` :
                         validity.status === "expiring" ? `Expiring · ${validity.days}d` :
                         "Expired"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{doc.desc}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={cn(
                      "text-[10px] font-medium",
                      doc.owner === "landlord" ? "text-primary" :
                      doc.owner === "tenant" ? "text-tenant" : "text-muted-foreground"
                    )}>
                      {doc.owner === "landlord" ? "Landlord" : doc.owner === "tenant" ? "Tenant" : "Either party"}
                    </span>
                    {isUploaded && doc.timestamp && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {doc.timestamp}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}
                <div className="shrink-0">
                  {isUploaded ? (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  ) : isLandlordDoc ? (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity">
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      Awaiting
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional uploads */}
      <button className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-border hover:border-primary/30 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
        <Upload className="w-4 h-4" />
        Upload additional document
      </button>
    </motion.div>
  );
}

function SummaryCard({ label, value, icon, color, bg }: {
  label: string; value: string; icon: React.ReactNode; color: string; bg: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-soft">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", bg, color)}>{icon}</div>
      </div>
      <p className={cn("font-display text-xl font-bold", color)}>{value}</p>
    </div>
  );
}
