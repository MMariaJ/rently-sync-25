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

// P1 is very early in onboarding — the Deposit Protection Certificate is the
// only freshly-collected doc. Gas Safety is pre-seeded as uploaded but stale
// (expired) so the renewal flow and AI fact extraction on re-upload still
// demo end-to-end; everything else stays pending.
const P1_VAULT_INIT: VaultDoc[] = VAULT_INIT.map(d => {
  if (d.name === "Deposit Protection Certificate") {
    return { ...d, status: "uploaded" as const, timestamp: "01 Feb 2026" };
  }
  if (d.name === "Gas Safety Certificate") {
    return { ...d, status: "uploaded" as const, timestamp: "15 Apr 2025" };
  }
  if (d.name === "How to Rent Guide") {
    return { ...d, status: "uploaded" as const, timestamp: "12 Jan 2026" };
  }
  return d;
});

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
   "Move-In Inventory", "HMO Licence"].includes(d.name)
    ? { ...d, status: "uploaded" as const, timestamp: "01 Jan 2026" }
    : d
);

export interface ActivityEvent {
  id: string;
  propId: string;
  title: string;
  date: string; // human, e.g. "Today" or "3 Apr"
  source: "task" | "vault" | "comms" | "system" | "review" | "nudge";
}

export interface Reminder {
  propId: string;
  taskId: string;
  setAt: number; // ms
  fireInDays: number;
}

// Runtime-added reviews use the shared Review shape. Re-exported under the
// legacy ReviewEntry name so callers don't have to churn.
import type {
  Review, TenantDimensions, LandlordDimensions, UserRole,
} from "@/data/constants";

export type ReviewEntry = Review;

export interface AppState {
  vaults: Record<string, VaultDoc[]>;
  completed: Record<string, boolean>;
  // taskKey (`${propId}_${taskId}`) -> filename uploaded for that task
  taskUploads: Record<string, string>;
  reminders: Reminder[];
  // docKey (`${propId}::${docName}`) -> AI-extracted facts
  extractedFacts: Record<string, ExtractedFacts>;
  events: ActivityEvent[];
  // User-submitted reviews (newest first), keyed list
  reviews: ReviewEntry[];
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
  // File a Comms attachment into the Vault under a chosen category.
  fileCommsAttachment: (args: {
    propId: string;
    vaultDoc: string;
    filename: string;
    sender: string;
  }) => void;
  // Add a review (landlord→tenant or tenant→landlord). Caller supplies
  // authorship + subject + direction-specific per-dimension scores; the
  // store stamps id/createdAt/dateLabel.
  addReview: (args: {
    authorId: string;
    authorRole: UserRole;
    subjectId: string;
    subjectRole: UserRole;
    propertyId: string;
    tenancyId: string;
    rating: number;
    body: string;
    tenantDimensions?: TenantDimensions;
    landlordDimensions?: LandlordDimensions;
  }) => void;
  // Tenant-initiated nudge about an overdue landlord obligation. `formal`
  // marks it as a "raise formally" rather than a casual reminder — both
  // flow through the same activity-event stream for now.
  nudgeLandlord: (args: {
    propId: string;
    docName: string;
    formal?: boolean;
  }) => void;
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

const todayLong = () => {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString("en-GB", { month: "short" })} ${d.getFullYear()}`;
};

export function useAppStore(): AppState & AppActions {
  const [vaults, setVaults] = useState<Record<string, VaultDoc[]>>(INITIAL_VAULTS);
  const [completed, setCompleted] = useState<Record<string, boolean>>({ ...COMPLETED_INIT });
  const [taskUploads, setTaskUploads] = useState<Record<string, string>>({});
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [extractedFacts, setExtractedFacts] =
    useState<Record<string, ExtractedFacts>>(() => seedExtractedFacts());
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);

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

  const fileCommsAttachment = useCallback<AppActions["fileCommsAttachment"]>(
    ({ propId, vaultDoc, filename, sender }) => {
      fileIntoVault(propId, vaultDoc);
      const facts = extractFactsFor(propId, vaultDoc);
      if (facts) {
        setExtractedFacts(prev => ({ ...prev, [`${propId}::${vaultDoc}`]: facts }));
      }
      pushEvent({
        propId,
        title: `${filename} · From Comms · ${sender} → filed in Vault`,
        source: "comms",
      });
    },
    [fileIntoVault, pushEvent],
  );

  const nudgeLandlord = useCallback<AppActions["nudgeLandlord"]>(
    ({ propId, docName, formal }) => {
      pushEvent({
        propId,
        title: formal
          ? `Formal request sent · ${docName} overdue`
          : `Nudge sent · ${docName} overdue`,
        source: "nudge",
      });
    },
    [pushEvent],
  );

  const addReview = useCallback<AppActions["addReview"]>(
    ({
      authorId, authorRole, subjectId, subjectRole,
      propertyId, tenancyId, rating, body,
      tenantDimensions, landlordDimensions,
    }) => {
      const now = Date.now();
      setReviews(prev => [
        {
          id: `rev-${now}`,
          authorId, authorRole, subjectId, subjectRole,
          propertyId, tenancyId, rating, body,
          tenantDimensions, landlordDimensions,
          createdAt: now,
          dateLabel: todayLong(),
        },
        ...prev,
      ]);
      pushEvent({
        propId: propertyId,
        title: `${authorRole === "landlord" ? "You reviewed your tenant" : "You reviewed your landlord"} · ${rating.toFixed(1)} ★`,
        source: "review",
      });
    },
    [pushEvent],
  );

  return {
    vaults, completed, taskUploads, reminders, extractedFacts, events, reviews,
    uploadDoc, uploadDocDirect, markTaskDone, unmarkTaskDone, setReminder,
    fileCommsAttachment, addReview, nudgeLandlord,
  };
}
