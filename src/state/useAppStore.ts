// Single source of truth for the demo. All landlord state lives here.
// In-memory only — resets on refresh, as agreed (client-side, no Cloud).
//
// Exposes:
//   - vaults, completed, reminders, extractedFacts, lastEvents (state)
//   - uploadDoc, markTaskDone, setReminder (actions)
//
// All cross-surface sync goes through this store: an upload from a Task
// auto-files the doc in the Vault, runs mock AI extraction, and emits an
// activity event the Overview can pick up.

import { useCallback, useState } from "react";
import {
  VAULT_INIT, COMPLETED_INIT,
  type VaultDoc,
} from "@/data/constants";
import { extractFactsFor, type ExtractedFacts } from "./engines";

const P1_VAULT_INIT: VaultDoc[] = VAULT_INIT.map(d =>
  d.name === "Tenancy Agreement (AST)"
    ? { ...d, status: "uploaded" as const, timestamp: "01 Feb 2026" }
    : d
);

const P2_VAULT_INIT: VaultDoc[] = VAULT_INIT.map(d =>
  d.name === "EPC Certificate" ? { ...d, status: "pending" as const } :
    ["Tenancy Agreement (AST)", "Gas Safety Certificate", "EICR Report",
     "How to Rent Guide", "Deposit Protection Certificate", "Move-In Inventory"]
      .includes(d.name)
      ? { ...d, status: "uploaded" as const, timestamp: "15 Mar 2025" }
      : d
);

const P3_VAULT_INIT: VaultDoc[] = VAULT_INIT.map(d =>
  ["Tenancy Agreement (AST)", "Gas Safety Certificate", "EPC Certificate",
   "EICR Report", "How to Rent Guide", "Deposit Protection Certificate",
   "Move-In Inventory"].includes(d.name)
    ? { ...d, status: "uploaded" as const, timestamp: "01 Jan 2026" }
    : d
);

export interface ActivityEvent {
  id: string;
  propId: string;
  title: string;
  date: string; // human, e.g. "Today" or "3 Apr"
  source: "task" | "vault" | "comms" | "system";
}

export interface Reminder {
  propId: string;
  taskId: string;
  setAt: number; // ms
  fireInDays: number;
}

export interface AppState {
  vaults: Record<string, VaultDoc[]>;
  completed: Record<string, boolean>;
  // taskKey (`${propId}_${taskId}`) -> filename uploaded for that task
  taskUploads: Record<string, string>;
  reminders: Reminder[];
  // docKey (`${propId}::${docName}`) -> AI-extracted facts
  extractedFacts: Record<string, ExtractedFacts>;
  events: ActivityEvent[];
}

export interface AppActions {
  // Upload a doc against a task. Auto-files into the property's Vault,
  // runs mock AI extraction, marks the task as done, emits an activity event.
  uploadDoc: (args: {
    propId: string;
    taskId: string;
    vaultDoc: string;
    filename?: string;
  }) => void;
  markTaskDone: (propId: string, taskId: string, taskTitle: string) => void;
  unmarkTaskDone: (propId: string, taskId: string) => void;
  setReminder: (propId: string, taskId: string, fireInDays?: number) => void;
  // Direct upload from the Vault tab (no task context). Files into vault.
  uploadDocDirect: (propId: string, vaultDoc: string, filename?: string) => void;
}

const INITIAL_VAULTS: Record<string, VaultDoc[]> = {
  p1: P1_VAULT_INIT,
  p2: P2_VAULT_INIT,
  p3: P3_VAULT_INIT,
};

// Pre-seed extracted facts for docs that are filed at startup so the ✦
// summaries on the Vault feel real from the first render.
function seedExtractedFacts(): Record<string, ExtractedFacts> {
  const out: Record<string, ExtractedFacts> = {};
  for (const propId of Object.keys(INITIAL_VAULTS)) {
    for (const doc of INITIAL_VAULTS[propId]) {
      if (doc.status === "uploaded") {
        const facts = extractFactsFor(propId, doc.name);
        if (facts) out[`${propId}::${doc.name}`] = facts;
      }
    }
  }
  return out;
}

const todayLabel = () => {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString("en-GB", { month: "short" })}`;
};

export function useAppStore(): AppState & AppActions {
  const [vaults, setVaults] = useState<Record<string, VaultDoc[]>>(INITIAL_VAULTS);
  const [completed, setCompleted] = useState<Record<string, boolean>>({ ...COMPLETED_INIT });
  const [taskUploads, setTaskUploads] = useState<Record<string, string>>({});
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [extractedFacts, setExtractedFacts] =
    useState<Record<string, ExtractedFacts>>(() => seedExtractedFacts());
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  const pushEvent = useCallback((e: Omit<ActivityEvent, "id" | "date">) => {
    setEvents(prev => [
      { ...e, id: `${Date.now()}-${Math.random()}`, date: todayLabel() },
      ...prev,
    ].slice(0, 30));
  }, []);

  const fileIntoVault = useCallback((propId: string, vaultDoc: string) => {
    setVaults(prev => {
      const list = prev[propId] ?? VAULT_INIT;
      const existing = list.find(d => d.name === vaultDoc);
      if (existing) {
        return {
          ...prev,
          [propId]: list.map(d =>
            d.name === vaultDoc
              ? { ...d, status: "uploaded" as const, timestamp: "Just now" }
              : d
          ),
        };
      }
      // New doc not in seed list — append.
      return {
        ...prev,
        [propId]: [
          ...list,
          {
            id: `v-${Date.now()}`,
            name: vaultDoc,
            desc: vaultDoc,
            owner: "landlord",
            status: "uploaded" as const,
            timestamp: "Just now",
          },
        ],
      };
    });
  }, []);

  const uploadDoc = useCallback<AppActions["uploadDoc"]>(({ propId, taskId, vaultDoc, filename }) => {
    const fname = filename ?? `${vaultDoc.replace(/\s+/g, "_")}.pdf`;
    setTaskUploads(prev => ({ ...prev, [`${propId}_${taskId}`]: fname }));
    fileIntoVault(propId, vaultDoc);
    setCompleted(prev => ({ ...prev, [`${propId}_${taskId}`]: true }));
    // Mock AI extraction
    const facts = extractFactsFor(propId, vaultDoc);
    if (facts) {
      setExtractedFacts(prev => ({ ...prev, [`${propId}::${vaultDoc}`]: facts }));
    }
    pushEvent({
      propId,
      title: `${vaultDoc} uploaded · filed in Vault`,
      source: "task",
    });
  }, [fileIntoVault, pushEvent]);

  const uploadDocDirect = useCallback<AppActions["uploadDocDirect"]>((propId, vaultDoc, filename) => {
    const fname = filename ?? `${vaultDoc.replace(/\s+/g, "_")}.pdf`;
    fileIntoVault(propId, vaultDoc);
    const facts = extractFactsFor(propId, vaultDoc);
    if (facts) {
      setExtractedFacts(prev => ({ ...prev, [`${propId}::${vaultDoc}`]: facts }));
    }
    pushEvent({
      propId,
      title: `${vaultDoc} uploaded`,
      source: "vault",
    });
    void fname;
  }, [fileIntoVault, pushEvent]);

  const markTaskDone = useCallback<AppActions["markTaskDone"]>((propId, taskId, taskTitle) => {
    setCompleted(prev => ({ ...prev, [`${propId}_${taskId}`]: true }));
    pushEvent({ propId, title: `${taskTitle} marked complete`, source: "task" });
  }, [pushEvent]);

  const unmarkTaskDone = useCallback<AppActions["unmarkTaskDone"]>((propId, taskId) => {
    setCompleted(prev => {
      const next = { ...prev };
      delete next[`${propId}_${taskId}`];
      return next;
    });
  }, []);

  const setReminder = useCallback<AppActions["setReminder"]>((propId, taskId, fireInDays = 7) => {
    setReminders(prev => [
      ...prev.filter(r => !(r.propId === propId && r.taskId === taskId)),
      { propId, taskId, setAt: Date.now(), fireInDays },
    ]);
    pushEvent({ propId, title: `Reminder set · nudge in ${fireInDays} days`, source: "system" });
  }, [pushEvent]);

  return {
    vaults, completed, taskUploads, reminders, extractedFacts, events,
    uploadDoc, uploadDocDirect, markTaskDone, unmarkTaskDone, setReminder,
  };
}
