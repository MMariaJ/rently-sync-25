import {
  PHASES, TASK_DATA, VAULT_INIT, PROP_ALERTS, DOC_VALIDITY_BY_PROP, PORTFOLIO,
  type Property, type TaskItem, type VaultDoc, type Alert,
} from "./constants";

const ALERT_DOC_NAMES = [
  { name: "Gas Safety Certificate", short: "Gas Safety" },
  { name: "EPC Certificate", short: "EPC" },
  { name: "EICR Report", short: "EICR" },
  { name: "Deposit Protection Certificate", short: "Deposit Cert" },
  { name: "How to Rent Guide", short: "How to Rent" },
];

export const getPropertyAlerts = (propId: string, propVault: VaultDoc[]): Alert[] => {
  const propAlerts = PROP_ALERTS[propId] || [];
  const propDocValidity = DOC_VALIDITY_BY_PROP[propId] || {};
  const propAddr = PORTFOLIO.find(p => p.id === propId)?.address || propId;
  const propLabel = propAddr.split(",")[0];

  const docIssues = ALERT_DOC_NAMES.map(({ name, short }) => {
    const uploaded = propVault.some(d => d.name === name && d.status === "uploaded");
    const validity = propDocValidity[name];
    const status = uploaded ? (validity?.status || "valid") : "missing";
    if (status === "valid") return null;
    return { short, status, severity: (status === "expired" || status === "missing" ? "high" : "medium") as "high" | "medium", docName: name, days: validity?.days };
  }).filter(Boolean) as { short: string; status: string; severity: "high" | "medium"; docName: string; days?: number }[];

  const coveredDocs = new Set(docIssues.filter(d => propAlerts.some(a => a.text.toLowerCase().includes(d.short.toLowerCase()))).map(d => d.docName));

  return [
    ...propAlerts.map(a => ({
      text: a.text,
      severity: a.severity,
      action: a.action || "View",
      type: "alert" as const,
      linkedTab: a.linkedTab,
      linkedPhaseIdx: a.linkedPhaseIdx,
      propId,
      property: propLabel,
    })),
    ...docIssues.filter(d => !coveredDocs.has(d.docName)).map(d => ({
      text: `${d.short} — ${d.status === "missing" ? "missing" : d.status === "expired" ? "expired" : "expiring soon"}`,
      severity: d.severity,
      action: d.status === "missing" ? "Upload" : d.status === "expired" ? "Renew" : "Review",
      type: "doc" as const,
      linkedTab: "vault" as string | undefined,
      linkedPhaseIdx: undefined,
      propId,
      property: propLabel,
    })),
  ].sort((a, b) => a.severity === "high" && b.severity !== "high" ? -1 : a.severity !== "high" && b.severity === "high" ? 1 : 0);
};

export const getLifecycleStage = (p: Property): string => {
  if (p.status === "vacant") return "Vacant";
  return "Active";
};

export const getComplianceForProperty = (
  propId: string,
  role: string,
  completed: Record<string, boolean>,
  vaults: Record<string, VaultDoc[]>,
  isHmo: boolean
): number => {
  const vault = vaults[propId] || VAULT_INIT;
  const isDocUploaded = (name: string) => vault.some(d => d.name === name && d.status === "uploaded");
  const isTaskDone = (task: TaskItem) => {
    if (completed[`${propId}_${task.id}`]) return true;
    if (task.vaultDoc && isDocUploaded(task.vaultDoc)) return true;
    return false;
  };

  const allTasks = PHASES.flatMap(p => (TASK_DATA[role]?.[p] || []).filter(
    (t: TaskItem) => !t.isContractUpload && !t.isContractSign && (!t.hmoOnly || isHmo)
  ));
  const doneCount = allTasks.filter(isTaskDone).length;
  return allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0;
};

export const getRAGColor = (pct: number): string => {
  if (pct === 0) return "hsl(var(--muted-foreground))";
  if (pct < 50) return "hsl(var(--danger))";
  if (pct < 80) return "hsl(var(--warning))";
  return "hsl(var(--success))";
};

export const getRAGLabel = (pct: number): string => {
  if (pct === 0) return "Not started";
  if (pct < 50) return "Action required";
  if (pct < 80) return "Needs attention";
  return "Compliant";
};
