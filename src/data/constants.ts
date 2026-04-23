// Property & tenant data for the prototype

export const PHASES = ["Pre-Move-In", "Move-In", "During Tenancy", "Move-Out", "Post-Tenancy"] as const;

// Utility arrangement drives the Utilities section framing in Payments.
// - tenant-direct: tenant pays the provider themselves; Open Banking verifies.
// - landlord-pays-inclusive: landlord pays, cost is baked into rent (no reliability tracking).
// - landlord-pays-recharge: landlord pays, tenants reimburse their share (reliability tracked).
export type UtilityArrangement =
  | "tenant-direct"
  | "landlord-pays-inclusive"
  | "landlord-pays-recharge";

export interface Property {
  id: string;
  address: string;
  postcode: string;
  tenant: string;
  rent: number;
  status: "active" | "vacant";
  compliance: number;
  nextDeadline: string;
  depositRef: string | null;
  depositScheme: string | null;
  depositAmount?: number;
  verified: boolean;
  contractUploaded: boolean;
  isHmo?: boolean;
  // Who is responsible for utility bills (HMO + single-let). Defaults to "tenants-pay".
  utilityMode?: "landlord-pays" | "tenants-pay";
  utilityArrangement?: UtilityArrangement;
  // Agreed move-in day — shown on the tenant dashboard and used to anchor
  // pre-move-in deadlines. ISO (YYYY-MM-DD) for day-math, label for display.
  moveInDate?: string;
  moveInIso?: string;
  // Single-let payment fields (HMO uses HMO_TENANTS instead)
  paymentStatus?: "paid" | "upcoming" | "late";
  paymentRef?: string;
  paidDate?: string;
  dueDate?: string;
  daysLate?: number;
  reliability?: { onTime: number; total: number };
}

export interface TenantInfo {
  name: string;
  avatarUrl: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  since: string;
  email: string;
}

export interface DocValidity {
  expiry: string;
  days: number;
  status: "valid" | "expiring" | "expired";
}

export interface Alert {
  text: string;
  severity: "high" | "medium";
  action: string;
  type: "alert" | "doc";
  linkedTab?: string;
  linkedPhaseIdx?: number;
  propId: string;
  property: string;
}

export interface VaultDoc {
  id: string;
  name: string;
  desc: string;
  owner: "landlord" | "tenant" | "both";
  status: "pending" | "uploaded";
  timestamp?: string;
  // --- Landlord-obligation metadata (optional) -----------------------------
  // Present on documents the landlord is statutorily required to provide.
  // The tenant Vault uses these to render the "Waiting on your landlord"
  // zone when a required doc is past its deadline.
  // One-line rule description — "Must be valid before tenancy start".
  statutoryDeadline?: string;
  // Tenant-perspective explanation of what protection is lost if the
  // landlord misses this. Used inside the Waiting card.
  whyThisMatters?: string;
}

export interface TaskItem {
  id: string;
  label: string;
  type: "legal" | "suggested";
  detail: string;
  isContractUpload?: boolean;
  isContractSign?: boolean;
  blocked?: boolean;
  vaultDoc?: string;
  hasChat?: boolean;
  chatContext?: string;
  requiresTenantSign?: boolean;
  hmoOnly?: boolean;
  verification?: any;
  // --- Tenant-task detail-panel fields -------------------------------------
  // All optional: an entry renders its section only when the field exists.
  // One-liner shown in a faint-purple block — what completing this unlocks.
  unlocks?: string;
  // Red block surfaced when the task is open: what happens if skipped.
  ifIgnored?: { label: string; body: string };
  // Numbered step-by-step guidance.
  howItWorks?: string[];
  // Label for the primary purple CTA in the right-hand action stack.
  primaryActionLabel?: string;
  // The landlord-side task that this tenant action mirrors, so completions
  // could be propagated across roles in the shared store (wired later).
  linkedLandlordTaskId?: string;
}

export const PORTFOLIO: Property[] = [
  { id: "p1", address: "14 Elmwood Road, London SE4 2BN", postcode: "London SE4 2BN", tenant: "Sarah Mitchell", rent: 1450, status: "active", compliance: 0, nextDeadline: "Tenancy agreement — not yet uploaded", depositRef: "MD2024-88421", depositScheme: "MyDeposits", depositAmount: 1450, verified: true, contractUploaded: false, utilityMode: "tenants-pay", utilityArrangement: "tenant-direct", moveInDate: "1 May 2026", moveInIso: "2026-05-01", paymentStatus: "upcoming", paymentRef: "OB-SM-05101", dueDate: "1 May 2026", reliability: { onTime: 0, total: 0 } },
  { id: "p2", address: "7 Crane Wharf, Greenwich SE10 0LN", postcode: "Greenwich SE10 0LN", tenant: "James Okafor", rent: 1800, status: "active", compliance: 0, nextDeadline: "EPC renewal overdue", depositRef: "DPS2025-11043", depositScheme: "DPS", depositAmount: 2700, verified: true, contractUploaded: true, utilityMode: "tenants-pay", utilityArrangement: "tenant-direct", paymentStatus: "upcoming", paymentRef: "OB-JO-04207", dueDate: "5 Apr 2026", reliability: { onTime: 11, total: 12 } },
  { id: "p3", address: "3 Saffron Court, Hackney E8 1QP", postcode: "Hackney E8 1QP", tenant: "3 tenants", rent: 1870, status: "active", compliance: 0, nextDeadline: "No actions due", depositRef: null, depositScheme: null, verified: true, contractUploaded: true, isHmo: true, utilityMode: "landlord-pays", utilityArrangement: "landlord-pays-recharge" },
];

export const TENANT_INFO: Record<string, TenantInfo> = {
  p1: { name: "Sarah Mitchell", avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face", rating: 4.9, reviewCount: 3, verified: true, since: "February 2026", email: "s.mitchell@email.com" },
  p2: { name: "James Okafor", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face", rating: 4.7, reviewCount: 5, verified: true, since: "March 2025", email: "j.okafor@email.com" },
};

// Where the tenant is in the tenancy lifecycle. The tenant Tasks tab reads
// this to pick which phase's tasks to show and to highlight the current
// stage in the lifecycle tracker.
export type TenancyPhase = "Pre-Move-In" | "Move-In" | "During Tenancy" | "Move-Out";

export interface TenancyInfo {
  currentPhase: TenancyPhase;
}

export const TENANCY_INFO: Record<string, TenancyInfo> = {
  p1: { currentPhase: "Pre-Move-In" },
  p2: { currentPhase: "During Tenancy" },
  p3: { currentPhase: "During Tenancy" },
};

export const PROP_CONTRACT: Record<string, { start: string; end: string; notice: string; type: string }> = {
  p1: { start: "01 May 2026", end: "30 Apr 2027", notice: "2 months", type: "Assured Shorthold Tenancy" },
  p2: { start: "15 Mar 2025", end: "14 Mar 2026", notice: "2 months", type: "Assured Shorthold Tenancy" },
  p3: { start: "01 Jan 2026", end: "31 Dec 2026", notice: "2 months", type: "HMO — Multiple ASTs" },
};

export const DOC_VALIDITY_BY_PROP: Record<string, Record<string, DocValidity>> = {
  p1: {
    "Gas Safety Certificate": { expiry: "15 Sep 2026", days: 149, status: "valid" },
    "EPC Certificate": { expiry: "03 Mar 2034", days: 2900, status: "valid" },
    "EICR Report": { expiry: "20 Jan 2030", days: 1400, status: "valid" },
    "Tenancy Agreement (AST)": { expiry: "31 Jan 2027", days: 312, status: "valid" },
    "Deposit Protection Certificate": { expiry: "01 Feb 2027", days: 313, status: "valid" },
  },
  p2: {
    "Gas Safety Certificate": { expiry: "15 Sep 2026", days: 170, status: "valid" },
    "EPC Certificate": { expiry: "17 May 2026", days: 28, status: "expiring" },
    "EICR Report": { expiry: "12 Jul 2026", days: 110, status: "expiring" },
    "Tenancy Agreement (AST)": { expiry: "14 Mar 2027", days: 352, status: "valid" },
    "Deposit Protection Certificate": { expiry: "15 Mar 2027", days: 353, status: "valid" },
  },
  p3: {
    "Gas Safety Certificate": { expiry: "15 Apr 2026", days: -4, status: "expired" },
    "EPC Certificate": { expiry: "15 Nov 2033", days: 2790, status: "valid" },
    "EICR Report": { expiry: "10 Jun 2030", days: 1540, status: "valid" },
    "Tenancy Agreement (AST)": { expiry: "08 Jun 2026", days: 50, status: "expiring" },
    "Deposit Protection Certificate": { expiry: "05 Aug 2026", days: 130, status: "expiring" },
  },
};

export const HMO_TENANTS: Record<string, Array<{
  id: string; name: string; room: string; rent: number; deposit: number; depositScheme: string;
  depositRef: string; leaseStart: string; leaseEnd: string; avatarUrl: string;
  verified: boolean; since: string; email: string; tasksDone: number; tasksTotal: number;
  rating: number; reviewCount: number;
  // Payments — current month
  paymentStatus: "paid" | "upcoming" | "late";
  paymentRef: string;     // bank reference for the most recent rent payment
  paidDate?: string;      // when the current month's rent was received
  dueDate: string;        // when this month's rent is/was due
  daysLate?: number;      // populated when status === "late"
  // 6-month reliability sparkline (most recent month last)
  reliability: { onTime: number; total: number };
}>> = {
  p3: [
    { id: "ht1", name: "Mia Chen", room: "1", rent: 650, deposit: 650, depositScheme: "MyDeposits", depositRef: "MD2026-33101", leaseStart: "01 Jan 2026", leaseEnd: "31 Dec 2026", avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face", verified: true, since: "January 2026", email: "m.chen@email.com", tasksDone: 8, tasksTotal: 12, rating: 4.8, reviewCount: 3, paymentStatus: "paid", paymentRef: "OB-MC-04261", paidDate: "1 Apr 2026", dueDate: "1 Apr 2026", reliability: { onTime: 6, total: 6 } },
    { id: "ht2", name: "Kwame Asante", room: "2", rent: 620, deposit: 620, depositScheme: "DPS", depositRef: "DPS2026-44205", leaseStart: "15 Feb 2026", leaseEnd: "14 Feb 2027", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face", verified: true, since: "February 2026", email: "k.asante@email.com", tasksDone: 5, tasksTotal: 12, rating: 4.5, reviewCount: 2, paymentStatus: "paid", paymentRef: "OB-KA-04158", paidDate: "15 Apr 2026", dueDate: "15 Apr 2026", reliability: { onTime: 2, total: 2 } },
    { id: "ht3", name: "Sofia Rossi", room: "3", rent: 600, deposit: 600, depositScheme: "MyDeposits", depositRef: "MD2026-33209", leaseStart: "01 Mar 2026", leaseEnd: "28 Feb 2027", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face", verified: true, since: "March 2026", email: "s.rossi@email.com", tasksDone: 3, tasksTotal: 12, rating: 4.2, reviewCount: 1, paymentStatus: "upcoming", paymentRef: "OB-SR-04309", dueDate: "20 Apr 2026", reliability: { onTime: 1, total: 1 } },
  ],
};

export const PROP_ALERTS: Record<string, { text: string; severity: "high" | "medium"; action: string; linkedTab?: string; linkedPhaseIdx?: number }[]> = {
  // p1's missing AST is surfaced inside the property (banner + hero + first
  // task), not on the main dashboard. Keeping PROP_ALERTS empty here means
  // the Dashboard compliance hero falls through to p3's gas-safety issue,
  // which is the right top-of-portfolio risk to surface.
  p1: [],
  p2: [
    { text: "EPC renewal due in 28 days", severity: "medium", action: "Renew now", linkedTab: "vault", linkedPhaseIdx: 2 },
    { text: "Smoke & CO alarm check — evidence needed", severity: "medium", action: "Upload", linkedTab: "tasks", linkedPhaseIdx: 1 },
  ],
  p3: [
    { text: "Gas Safety Certificate renewal overdue", severity: "high", action: "Review", linkedTab: "vault", linkedPhaseIdx: 2 },
  ],
};

export const TASK_DATA: Record<string, Record<string, TaskItem[]>> = {
  landlord: {
    "Pre-Move-In": [
      { id: "l0", label: "Upload Tenancy Agreement", type: "legal", detail: "The contract engine. All obligations are derived from this document.", isContractUpload: true },
      { id: "l1", label: "Register deposit with TDP scheme", type: "legal", detail: "Register within 30 days of receipt.", blocked: true, vaultDoc: "Deposit Protection Certificate" },
      { id: "l2", label: "Upload EPC (min. rating E)", type: "legal", detail: "Valid EPC required before tenancy begins.", blocked: true, vaultDoc: "EPC Certificate" },
      { id: "l3", label: "Upload Gas Safety Certificate", type: "legal", detail: "Initial Gas Safe certificate required.", blocked: true, vaultDoc: "Gas Safety Certificate" },
      { id: "l4", label: "Upload EICR (Electrical Report)", type: "legal", detail: "Required every 5 years.", blocked: true, vaultDoc: "EICR Report" },
      { id: "l5", label: "Provide 'How to Rent' guide", type: "legal", detail: "Must be provided before tenancy begins.", blocked: true, vaultDoc: "How to Rent Guide" },
      { id: "l6", label: "Upload property inventory + photos", type: "suggested", detail: "Timestamped photographic record.", blocked: true, vaultDoc: "Move-In Inventory" },
      { id: "l7", label: "Set initial meter readings", type: "suggested", detail: "Photograph meter readings on move-in day.", blocked: true, vaultDoc: "Meter Reading Photos" },
      { id: "l_hmo1", label: "Upload HMO licence", type: "legal", detail: "Mandatory for 5+ tenants from 2+ households.", blocked: true, vaultDoc: "HMO Licence", hmoOnly: true },
    ],
    "Move-In": [
      { id: "l8", label: "Hand over keys (log in app)", type: "suggested", detail: "Log key handover — date, time, number of sets." },
      { id: "l9", label: "Evidence smoke & CO alarm check", type: "legal", detail: "Test all alarms on the first day of tenancy.", vaultDoc: "Smoke & CO Alarm Evidence" },
      { id: "l10", label: "Countersign move-in inventory", type: "suggested", detail: "Countersign after tenant review.", requiresTenantSign: true },
    ],
    "During Tenancy": [
      { id: "l12", label: "Respond to repair requests (28 days)", type: "legal", detail: "Legally required.", hasChat: true, chatContext: "Repair Request" },
      { id: "l13", label: "Annual gas safety check", type: "legal", detail: "New certificate required every 12 months.", vaultDoc: "Gas Safety Certificate" },
      { id: "l15", label: "Review & agree rent increase", type: "legal", detail: "Serve correct notice.", hasChat: true, chatContext: "Rent Review" },
      { id: "l22", label: "Renew EPC certificate", type: "legal", detail: "EPC must remain valid.", vaultDoc: "EPC Certificate" },
    ],
    "Move-Out": [
      { id: "l16", label: "Complete check-out inspection", type: "suggested", detail: "Compare to move-in inventory." },
      { id: "l17", label: "Upload damage evidence", type: "suggested", detail: "Timestamped photos.", vaultDoc: "Move-Out Photos" },
      { id: "l18", label: "Submit itemised deposit deduction", type: "legal", detail: "Itemised list required.", hasChat: true, chatContext: "Deposit Deduction" },
      { id: "l19", label: "Return deposit within 10 days", type: "legal", detail: "Legal obligation." },
    ],
    "Post-Tenancy": [
      { id: "l21", label: "Issue tenant reference", type: "suggested", detail: "Provide a reference via the app." },
    ],
  },
  tenant: {
    "Pre-Move-In": [
      {
        id: "t1",
        label: "Review & sign tenancy agreement",
        type: "legal",
        detail: "Review the draft sent by your landlord, then e-sign to lock in your move-in.",
        isContractSign: true,
        unlocks: "Once signed, your deposit can be protected and your keys arranged for move-in day.",
        ifIgnored: {
          label: "If left unsigned",
          body: "Move-in is on hold. Without a signed agreement you have no legally binding tenancy and can't take occupancy on the agreed date.",
        },
        howItWorks: [
          "Open the draft agreement from your Vault — it's the version David sent.",
          "Review each clause: rent, term, notice period, repair obligations.",
          "E-sign in HomeBound. You and David both get a signed copy filed automatically.",
        ],
        primaryActionLabel: "Review & sign",
        linkedLandlordTaskId: "l0",
      },
      {
        id: "t2",
        label: "Pay & log holding deposit",
        type: "legal",
        detail: "One week's rent paid to reserve the property until contracts complete.",
        unlocks: "Takes the property off the market for you while the full deposit and contract are arranged.",
        ifIgnored: {
          label: "If not paid",
          body: "The landlord can re-list the property and offer it to another applicant.",
        },
        howItWorks: [
          "Transfer one week's rent to the landlord's account using the reference in your Vault.",
          "Log the payment here with the reference so HomeBound can match it.",
          "The landlord confirms receipt — this amount is applied to your first month's rent.",
        ],
        primaryActionLabel: "Log payment",
      },
      {
        id: "t3",
        label: "Pay security deposit",
        type: "legal",
        detail: "Full security deposit transferred to the landlord ahead of move-in.",
        unlocks: "The landlord then registers it with a government-backed deposit protection scheme on your behalf.",
        ifIgnored: {
          label: "If not paid",
          body: "Move-in can't proceed. The full deposit must be cleared before the tenancy start date.",
        },
        howItWorks: [
          "Transfer the full deposit to the landlord using the reference in your Vault.",
          "Mark paid here so HomeBound can reconcile the payment.",
          "Within 30 days the landlord registers it with MyDeposits and sends you a protection certificate.",
        ],
        primaryActionLabel: "Pay deposit",
        linkedLandlordTaskId: "l1",
      },
      {
        id: "t5",
        label: "Confirm receipt of 'How to Rent' guide",
        type: "legal",
        detail: "Confirm you've received and read the government tenant-rights booklet.",
        unlocks: "Standard pre-tenancy legal step — completing it means nothing more is needed from you here.",
        ifIgnored: {
          label: "Why this matters",
          body: "If the guide was never served, your landlord can't issue a valid Section 21 notice later — but confirming that you've read it protects both sides.",
        },
        howItWorks: [
          "Open the 'How to Rent' guide from your Vault.",
          "Skim or read fully — it covers deposits, repairs, rent rises, and notice rules.",
          "Tick 'I've read this' to file your confirmation.",
        ],
        primaryActionLabel: "Mark as read",
        linkedLandlordTaskId: "l5",
      },
      {
        id: "t6",
        label: "Confirm move-in date",
        type: "suggested",
        detail: "Agree a specific date with your landlord so keys and inventory can be scheduled.",
        unlocks: "Locks in move-in day so keys, inventory walk-through and first-rent timing can all be arranged.",
        ifIgnored: {
          label: "If unconfirmed",
          body: "Keys and the inventory walk-through can't be scheduled until both sides agree on a concrete date.",
        },
        howItWorks: [
          "Review the date your landlord has proposed.",
          "If it needs to shift, suggest an alternative via the Comms tab.",
          "Confirm once agreed — this triggers key handover scheduling.",
        ],
        primaryActionLabel: "Confirm date",
      },
    ],
    "Move-In": [
      { id: "t7", label: "Report pre-existing damage", type: "suggested", detail: "Log and photograph any damage.", hasChat: true, chatContext: "Pre-existing Damage" },
      { id: "t8", label: "Take & upload move-in photos", type: "suggested", detail: "Timestamped photos.", vaultDoc: "Move-In Photos" },
      { id: "t9", label: "Review & confirm move-in inventory", type: "suggested", detail: "Confirm each item.", primaryActionLabel: "Review inventory" },
      { id: "t11", label: "Confirm smoke & CO alarm tested", type: "legal", detail: "Confirm alarms are working on move-in day." },
      { id: "t_u1", label: "Set up energy supplier", type: "suggested", detail: "Register with your energy provider.", primaryActionLabel: "Add account & connect bank" },
      { id: "t_u2", label: "Set up water account", type: "suggested", detail: "Contact your water authority.", primaryActionLabel: "Add account & connect bank" },
      { id: "t_u3", label: "Set up broadband", type: "suggested", detail: "Arrange broadband connection.", primaryActionLabel: "Add account & connect bank" },
      { id: "t_g1", label: "Register for council tax", type: "legal", detail: "Register as liable person.", primaryActionLabel: "Add account & connect bank" },
    ],
    "During Tenancy": [
      { id: "t12", label: "Pay rent on time", type: "legal", detail: "Rent tracked via open banking." },
      { id: "t13", label: "Report repairs & issues", type: "suggested", detail: "Log issues.", hasChat: true, chatContext: "Repair Request" },
      { id: "t14", label: "Allow access for inspections", type: "legal", detail: "Confirm access via the app." },
    ],
    "Move-Out": [
      { id: "t16", label: "Serve correct notice period", type: "legal", detail: "Notice served and timestamped." },
      { id: "t17", label: "Take move-out photos", type: "suggested", detail: "Timestamped photos.", vaultDoc: "Move-Out Photos" },
      { id: "t18", label: "Return all keys (logged)", type: "suggested", detail: "Key return logged." },
    ],
    "Post-Tenancy": [
      { id: "t21", label: "Confirm deposit return", type: "legal", detail: "Upload proof of receipt.", vaultDoc: "Deposit Return Confirmation" },
      { id: "t22", label: "Request tenancy reference", type: "suggested", detail: "Request reference from landlord." },
    ],
  },
};

export const LANDLORD_PROFILE = {
  name: "David Patel",
  avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
  rating: 4.8,
  reviewCount: 12,
  verified: true,
  memberSince: "September 2023",
  // Typical reply latency — shown on the tenant dashboard landlord card.
  responseTime: "2h",
};

export const VAULT_INIT: VaultDoc[] = [
  { id: "v1", name: "Tenancy Agreement (AST)", desc: "The binding contract.", owner: "landlord", status: "pending" },
  {
    id: "v2", name: "Gas Safety Certificate", desc: "Annual check by a Gas Safe engineer.",
    owner: "landlord", status: "pending",
    statutoryDeadline: "A valid certificate must be in place on the first day of tenancy, renewed every 12 months",
    whyThisMatters: "Without a current gas safety certificate you have no proof the boiler and gas appliances are safe, and the landlord can't serve a valid Section 21 notice.",
  },
  {
    id: "v3", name: "EPC Certificate", desc: "Energy performance rating.",
    owner: "landlord", status: "pending",
    statutoryDeadline: "Must be provided before the tenancy begins",
    whyThisMatters: "Without an EPC on file the property's energy rating is unverified, and the landlord can't serve a valid Section 21 notice if the tenancy ends in dispute.",
  },
  { id: "v4", name: "EICR Report", desc: "Electrical installation report.", owner: "landlord", status: "pending" },
  {
    id: "v5", name: "How to Rent Guide", desc: "Government guide for tenants.",
    owner: "landlord", status: "pending",
    statutoryDeadline: "Must be served before the tenancy begins",
    whyThisMatters: "Without this on record your landlord loses the right to serve a valid Section 21 notice and you may miss information about your own rights.",
  },
  { id: "v6", name: "Move-In Inventory", desc: "Condition record of every item.", owner: "both", status: "pending" },
  { id: "v7", name: "Move-In Photos", desc: "Timestamped photos.", owner: "tenant", status: "pending" },
  { id: "v8", name: "Move-Out Photos", desc: "Condition comparison at end.", owner: "tenant", status: "pending" },
  {
    id: "v9", name: "Deposit Protection Certificate", desc: "TDP scheme certificate.",
    owner: "landlord", status: "pending",
    statutoryDeadline: "Required within 30 days of the deposit being received",
    whyThisMatters: "An unprotected deposit entitles you to between 1× and 3× the deposit in compensation, and the landlord loses their right to issue a Section 21 notice.",
  },
  // Keep the vault's "Still to collect" section in sync with the task list —
  // any doc referenced by a landlord task must appear here, pending, so it
  // surfaces for upload on fresh properties.
  { id: "v10", name: "Smoke & CO Alarm Evidence", desc: "Photographs from the first-day alarm test.", owner: "landlord", status: "pending" },
  { id: "v11", name: "Meter Reading Photos", desc: "Gas, electricity and water meter readings on move-in day.", owner: "landlord", status: "pending" },
  { id: "v12", name: "HMO Licence", desc: "Mandatory licence for HMO properties.", owner: "landlord", status: "pending" },
];

// Completed task IDs for p2 and p3 (demo data).
// p1 is seeded as pre-move-in: the security deposit is the only task that's
// been settled so far — everything else is pending.
export const COMPLETED_INIT: Record<string, boolean> = {
  // Security deposit is paid and the Deposit Protection Certificate is in the
  // vault. Nothing else for p1 is done yet.
  "p1_t3": true,
  "p2_l2": true,
  "p2_l8": true, "p2_l10": true, "p2_l12": true, "p2_l14": true, "p2_l28": true,
  "p2_t2": true, "p2_t3": true, "p2_t5": true, "p2_t6": true,
  "p2_t7": true, "p2_t8": true, "p2_t9": true, "p2_t11": true,
  "p2_t_u1": true, "p2_t_u2": true, "p2_t_u3": true,
  "p2_t_g1": true,
  "p2_t13": true, "p2_t14": true,
  "p3_l8": true, "p3_l10": true, "p3_l12": true, "p3_l14": true,
  "p3_l_hmo1": true,
  "p3_l15": true, "p3_l23": true,
  "p3_t2": true, "p3_t3": true, "p3_t5": true, "p3_t6": true,
  "p3_t7": true, "p3_t8": true, "p3_t9": true, "p3_t11": true,
  "p3_t_u1": true, "p3_t_u2": true, "p3_t_u3": true,
  "p3_t_g1": true,
  "p3_t12": true, "p3_t13": true,
};

export const PAYMENTS_BY_PROP: Record<string, Array<{ date: string; amount: string; status: string; hash: string }>> = {
  p1: [],
  p2: [
    { date: "01 Mar 2026", amount: "£1,800", status: "verified", hash: "2c7f…e8a1" },
    { date: "01 Feb 2026", amount: "£1,800", status: "missed", hash: "" },
    { date: "01 Jan 2026", amount: "£1,800", status: "verified", hash: "4d3b…f912" },
  ],
  p3: [
    { date: "01 Mar 2026", amount: "£1,870", status: "verified", hash: "8f2a…c341" },
    { date: "01 Feb 2026", amount: "£1,870", status: "verified", hash: "3b9e…d102" },
    { date: "01 Jan 2026", amount: "£1,870", status: "verified", hash: "7c5d…a843" },
  ],
};

export const RECURRING_PAYMENTS: Record<string, Array<{
  id: string; type: string; label: string; provider: string; amount: number;
  frequency: string; dueDay: number; dueDate: string; lastPaidDate: string | null;
  status: "paid" | "due_soon" | "overdue" | "upcoming";
}>> = {
  p2: [
    { id: "rp1", type: "rent", label: "Rent", provider: "David Patel", amount: 1800, frequency: "monthly", dueDay: 1, dueDate: "1 Apr 2026", lastPaidDate: "1 Mar 2026", status: "paid" },
    { id: "rp2", type: "council_tax", label: "Council Tax", provider: "Greenwich Council", amount: 142, frequency: "monthly", dueDay: 1, dueDate: "1 Apr 2026", lastPaidDate: "1 Mar 2026", status: "due_soon" },
    { id: "rp3", type: "electricity", label: "Electricity", provider: "British Gas", amount: 134, frequency: "monthly", dueDay: 28, dueDate: "28 Mar 2026", lastPaidDate: "25 Feb 2026", status: "overdue" },
    { id: "rp4", type: "gas", label: "Gas", provider: "British Gas", amount: 67, frequency: "monthly", dueDay: 28, dueDate: "28 Mar 2026", lastPaidDate: "28 Feb 2026", status: "paid" },
    { id: "rp5", type: "water", label: "Water", provider: "Thames Water", amount: 42, frequency: "monthly", dueDay: 30, dueDate: "30 Mar 2026", lastPaidDate: "28 Feb 2026", status: "paid" },
    { id: "rp6", type: "internet", label: "Internet", provider: "BT Broadband", amount: 30, frequency: "monthly", dueDay: 14, dueDate: "14 Apr 2026", lastPaidDate: "14 Mar 2026", status: "paid" },
  ],
  p1: [],
  p3: [
    { id: "rp1", type: "rent", label: "Rent (Mia Chen)", provider: "David Patel", amount: 650, frequency: "monthly", dueDay: 1, dueDate: "1 Apr 2026", lastPaidDate: "1 Mar 2026", status: "paid" },
    { id: "rp2", type: "rent", label: "Rent (Kwame Asante)", provider: "David Patel", amount: 620, frequency: "monthly", dueDay: 15, dueDate: "15 Apr 2026", lastPaidDate: "15 Mar 2026", status: "paid" },
    { id: "rp3", type: "rent", label: "Rent (Sofia Rossi)", provider: "David Patel", amount: 600, frequency: "monthly", dueDay: 1, dueDate: "1 Apr 2026", lastPaidDate: null, status: "upcoming" },
  ],
};

// Property photos placeholder
import propElmwood from "@/assets/property-elmwood.jpg";
import propCrane from "@/assets/property-crane.jpg";
import propSaffron from "@/assets/property-saffron.jpg";

export const PROP_PHOTOS: Record<string, { label: string; src: string }[]> = {
  p1: [
    { label: "Front of house", src: propElmwood },
    { label: "Living Room", src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop" },
    { label: "Kitchen", src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop" },
  ],
  p2: [
    { label: "Building exterior", src: propCrane },
    { label: "Bedroom", src: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop" },
    { label: "Living", src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop" },
  ],
  p3: [
    { label: "Front door", src: propSaffron },
    { label: "Living Room", src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop" },
    { label: "Bedroom", src: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop" },
  ],
};

export const PROP_RATINGS: Record<string, { rating: number; count: number }> = {
  p1: { rating: 4.9, count: 3 },
  p2: { rating: 4.7, count: 5 },
  p3: { rating: 4.6, count: 6 },
};

// Six-month rent reliability sparkline. Most recent month last.
// Each entry: month label, expected payments, paid-on-time count, and
// (for the in-progress month) a 0-1 collected ratio.
export const RELIABILITY_HISTORY: Record<string, Array<{
  month: string;
  expected: number;
  paidOnTime: number;
  collectedRatio?: number; // populated only for the current in-progress month
  inProgress?: boolean;
}>> = {
  p1: [
    { month: "Nov", expected: 1, paidOnTime: 1 },
    { month: "Dec", expected: 1, paidOnTime: 1 },
    { month: "Jan", expected: 1, paidOnTime: 1 },
    { month: "Feb", expected: 1, paidOnTime: 1 },
    { month: "Mar", expected: 1, paidOnTime: 1 },
    { month: "Apr", expected: 1, paidOnTime: 1, inProgress: true, collectedRatio: 1 },
  ],
  p2: [
    { month: "Nov", expected: 1, paidOnTime: 1 },
    { month: "Dec", expected: 1, paidOnTime: 1 },
    { month: "Jan", expected: 1, paidOnTime: 1 },
    { month: "Feb", expected: 1, paidOnTime: 0 },
    { month: "Mar", expected: 1, paidOnTime: 1 },
    { month: "Apr", expected: 1, paidOnTime: 1, inProgress: true, collectedRatio: 1 },
  ],
  p3: [
    { month: "Nov", expected: 2, paidOnTime: 2 },
    { month: "Dec", expected: 2, paidOnTime: 2 },
    { month: "Jan", expected: 3, paidOnTime: 3 },
    { month: "Feb", expected: 3, paidOnTime: 3 },
    { month: "Mar", expected: 3, paidOnTime: 3 },
    { month: "Apr", expected: 3, paidOnTime: 2, inProgress: true, collectedRatio: 2 / 3 },
  ],
};

// Landlord-paid utility bills (HMO p3). Split equally across occupied tenants.
export const HMO_UTILITIES: Record<string, Array<{
  id: string;
  type: string;       // e.g. "Electricity", "Gas", "Water", "Broadband"
  provider: string;
  dueDate: string;
  amount: number;
  status: "paid" | "upcoming" | "overdue";
}>> = {
  p3: [
    { id: "u1", type: "Electricity", provider: "Octopus Energy", dueDate: "12 Apr 2026", amount: 142, status: "paid" },
    { id: "u2", type: "Gas",         provider: "Octopus Energy", dueDate: "12 Apr 2026", amount: 78,  status: "paid" },
    { id: "u3", type: "Water",       provider: "Thames Water",   dueDate: "22 Apr 2026", amount: 54,  status: "upcoming" },
    { id: "u4", type: "Broadband",   provider: "BT",             dueDate: "5 Apr 2026",  amount: 38,  status: "overdue" },
  ],
};

// Past months for the Payment history list (most recent first).
// Each entry stores the totals + a derived status sentence input (lateCount).
export const PAYMENT_HISTORY_MONTHS: Record<string, Array<{
  monthLabel: string;     // "March 2026"
  rentTotal: number;
  utilitiesTotal: number;
  lateCount: number;      // 0 when fully on time
}>> = {
  p1: [
    { monthLabel: "March 2026",    rentTotal: 1450, utilitiesTotal: 0, lateCount: 0 },
    { monthLabel: "February 2026", rentTotal: 1450, utilitiesTotal: 0, lateCount: 0 },
    { monthLabel: "January 2026",  rentTotal: 1450, utilitiesTotal: 0, lateCount: 0 },
  ],
  p2: [
    { monthLabel: "March 2026",    rentTotal: 1800, utilitiesTotal: 0, lateCount: 0 },
    { monthLabel: "February 2026", rentTotal: 1800, utilitiesTotal: 0, lateCount: 1 },
    { monthLabel: "January 2026",  rentTotal: 1800, utilitiesTotal: 0, lateCount: 0 },
  ],
  p3: [
    { monthLabel: "March 2026",    rentTotal: 1870, utilitiesTotal: 312, lateCount: 0 },
    { monthLabel: "February 2026", rentTotal: 1250, utilitiesTotal: 298, lateCount: 0 },
    { monthLabel: "January 2026",  rentTotal: 650,  utilitiesTotal: 286, lateCount: 0 },
  ],
};

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
// Reviews flow in two directions: tenant-of-landlord and landlord-of-tenant.
// Each review is authored by one party and subjects another; the Reviews
// surface splits by *direction* (received vs given) to keep authorship and
// subject from getting tangled (e.g. "Sarah reviewing Sarah").

export type UserRole = "tenant" | "landlord";

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

// Anchor IDs for the two current sessions. One landlord (David) and one
// tenant (Sarah) — plus past/other users referenced by seed reviews.
export const LANDLORD_USER_ID = "ll-david";
export const TENANT_USER_ID = "t-sarah";

export const USERS: Record<string, AppUser> = {
  "ll-david":   { id: "ll-david",   name: "David Patel",    role: "landlord", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face" },
  "ll-ada":     { id: "ll-ada",     name: "Ada Okonkwo",    role: "landlord", avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face" },
  "ll-marcus":  { id: "ll-marcus",  name: "Marcus Hill",    role: "landlord", avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face" },
  "t-sarah":    { id: "t-sarah",    name: "Sarah Mitchell", role: "tenant",   avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face" },
  "t-james":    { id: "t-james",    name: "James Okafor",   role: "tenant",   avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face" },
  "t-priya":    { id: "t-priya",    name: "Priya Sharma",   role: "tenant",   avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face" },
  "t-mia":      { id: "t-mia",      name: "Mia Chen",       role: "tenant",   avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face" },
  "t-kwame":    { id: "t-kwame",    name: "Kwame Asante",   role: "tenant",   avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face" },
};

// Per-dimension scores differ by direction of the review.
// Tenant-of-landlord: responsiveness, maintenance, fairness, communication.
// Landlord-of-tenant: paysOnTime, communication, careOfProperty.
export interface TenantDimensions {
  responsiveness: number;
  maintenance: number;
  fairness: number;
  communication: number;
}
export interface LandlordDimensions {
  paysOnTime: number;
  communication: number;
  careOfProperty: number;
}

export interface Review {
  id: string;
  authorId: string;
  authorRole: UserRole;
  subjectId: string;
  subjectRole: UserRole;
  // Property the review is tied to — propertyId may be a synthetic id
  // (e.g. "past-ada") for past tenancies not in the active portfolio.
  propertyId: string;
  tenancyId: string;
  rating: number; // overall 1-5
  body: string;
  createdAt: number; // ms epoch — sortable
  dateLabel: string; // human-readable
  tenantDimensions?: TenantDimensions;  // set when authorRole = tenant
  landlordDimensions?: LandlordDimensions; // set when authorRole = landlord
}

// Past tenancies referenced by seed reviews for users outside the active
// portfolio (e.g. Sarah's prior landlords, a tenant who just moved out).
// Minimal shape — just enough to render an address label on review rows.
export interface PastTenancy {
  id: string;
  propertyId: string;
  propertyLabel: string;
  tenantId: string;
  landlordId: string;
  endedAt: string; // human
}

export const PAST_TENANCIES: PastTenancy[] = [
  { id: "ten-p2-priya",        propertyId: "p2",        propertyLabel: "7 Crane Wharf",   tenantId: "t-priya",  landlordId: "ll-david",  endedAt: "12 Apr 2026" },
  { id: "ten-past-sarah-marcus", propertyId: "past-marcus", propertyLabel: "22 Foxgrove Rd, London", tenantId: "t-sarah",  landlordId: "ll-marcus", endedAt: "15 Jan 2026" },
  { id: "ten-past-sarah-ada",    propertyId: "past-ada",    propertyLabel: "4 Camberwell Grove, London", tenantId: "t-sarah",  landlordId: "ll-ada",    endedAt: "30 Jun 2024" },
];

// Human label for a property — resolves active portfolio and past tenancies.
export function propertyLabelFor(propertyId: string): string {
  const active = PORTFOLIO.find(p => p.id === propertyId);
  if (active) return active.address.split(",")[0];
  const past = PAST_TENANCIES.find(t => t.propertyId === propertyId);
  if (past) return past.propertyLabel.split(",")[0];
  return propertyId;
}

// Seed reviews — span active tenancies + past tenancies, both directions.
// Sorted newest-first when shown in a list (consumers call sort).
export const REVIEWS_SEED: Review[] = [
  // --- p2 current tenancy: James <-> David ---
  {
    id: "rv1", authorId: "t-james", authorRole: "tenant",
    subjectId: "ll-david", subjectRole: "landlord",
    propertyId: "p2", tenancyId: "ten-p2-james",
    rating: 4.5, body: "Good property but the EPC situation needs sorting. Otherwise a fair landlord.",
    createdAt: new Date("2026-01-10").getTime(), dateLabel: "10 Jan 2026",
    tenantDimensions: { responsiveness: 4, maintenance: 4, fairness: 5, communication: 5 },
  },
  {
    id: "rv2", authorId: "t-james", authorRole: "tenant",
    subjectId: "ll-david", subjectRole: "landlord",
    propertyId: "p2", tenancyId: "ten-p2-james",
    rating: 5, body: "Repairs handled quickly and professionally.",
    createdAt: new Date("2025-12-01").getTime(), dateLabel: "1 Dec 2025",
    tenantDimensions: { responsiveness: 5, maintenance: 5, fairness: 5, communication: 5 },
  },
  {
    id: "rv3", authorId: "t-james", authorRole: "tenant",
    subjectId: "ll-david", subjectRole: "landlord",
    propertyId: "p2", tenancyId: "ten-p2-james",
    rating: 4.5, body: "Everything has been straightforward.",
    createdAt: new Date("2025-10-01").getTime(), dateLabel: "1 Oct 2025",
    tenantDimensions: { responsiveness: 4, maintenance: 5, fairness: 4, communication: 5 },
  },
  {
    id: "rv4", authorId: "ll-david", authorRole: "landlord",
    subjectId: "t-james", subjectRole: "tenant",
    propertyId: "p2", tenancyId: "ten-p2-james",
    rating: 4.5, body: "Reliable tenant, good communication. One missed payment but resolved quickly.",
    createdAt: new Date("2025-12-15").getTime(), dateLabel: "15 Dec 2025",
    landlordDimensions: { paysOnTime: 4, communication: 5, careOfProperty: 5 },
  },
  {
    id: "rv5", authorId: "ll-david", authorRole: "landlord",
    subjectId: "t-james", subjectRole: "tenant",
    propertyId: "p2", tenancyId: "ten-p2-james",
    rating: 5, body: "Very respectful of the property.",
    createdAt: new Date("2025-11-01").getTime(), dateLabel: "1 Nov 2025",
    landlordDimensions: { paysOnTime: 5, communication: 5, careOfProperty: 5 },
  },

  // --- p2 past tenancy: Priya reviewed David; David has NOT reviewed Priya
  //     (this drives the landlord "review moment" prompt).
  {
    id: "rv6", authorId: "t-priya", authorRole: "tenant",
    subjectId: "ll-david", subjectRole: "landlord",
    propertyId: "p2", tenancyId: "ten-p2-priya",
    rating: 5, body: "David was a brilliant landlord throughout — always responsive and fair.",
    createdAt: new Date("2026-04-14").getTime(), dateLabel: "14 Apr 2026",
    tenantDimensions: { responsiveness: 5, maintenance: 5, fairness: 5, communication: 5 },
  },

  // --- p3 HMO reviews of the landlord ---
  {
    id: "rv7", authorId: "t-mia", authorRole: "tenant",
    subjectId: "ll-david", subjectRole: "landlord",
    propertyId: "p3", tenancyId: "ten-p3-mia",
    rating: 5, body: "Well-managed HMO, common areas always clean.",
    createdAt: new Date("2026-02-20").getTime(), dateLabel: "20 Feb 2026",
    tenantDimensions: { responsiveness: 5, maintenance: 5, fairness: 5, communication: 5 },
  },
  {
    id: "rv8", authorId: "t-kwame", authorRole: "tenant",
    subjectId: "ll-david", subjectRole: "landlord",
    propertyId: "p3", tenancyId: "ten-p3-kwame",
    rating: 4.5, body: "Good landlord, handles shared living well.",
    createdAt: new Date("2026-02-10").getTime(), dateLabel: "10 Feb 2026",
    tenantDimensions: { responsiveness: 4, maintenance: 5, fairness: 5, communication: 5 },
  },

  // --- Sarah's past tenancies — she RECEIVED reviews from two past landlords.
  //     Marcus (most recent) — Sarah has NOT reviewed him (drives tenant moment).
  {
    id: "rv9", authorId: "ll-marcus", authorRole: "landlord",
    subjectId: "t-sarah", subjectRole: "tenant",
    propertyId: "past-marcus", tenancyId: "ten-past-sarah-marcus",
    rating: 5, body: "Excellent tenant — immaculate flat on handover and a pleasure throughout.",
    createdAt: new Date("2026-01-20").getTime(), dateLabel: "20 Jan 2026",
    landlordDimensions: { paysOnTime: 5, communication: 5, careOfProperty: 5 },
  },
  //     Ada (earlier) — Sarah HAS reviewed Ada (shows up under "given").
  {
    id: "rv10", authorId: "ll-ada", authorRole: "landlord",
    subjectId: "t-sarah", subjectRole: "tenant",
    propertyId: "past-ada", tenancyId: "ten-past-sarah-ada",
    rating: 4.8, body: "Very considerate and reliable with rent. Would happily rent to her again.",
    createdAt: new Date("2024-06-30").getTime(), dateLabel: "30 Jun 2024",
    landlordDimensions: { paysOnTime: 5, communication: 4, careOfProperty: 5 },
  },
  {
    id: "rv11", authorId: "t-sarah", authorRole: "tenant",
    subjectId: "ll-ada", subjectRole: "landlord",
    propertyId: "past-ada", tenancyId: "ten-past-sarah-ada",
    rating: 5, body: "Ada was warm and responsive — made the whole tenancy effortless.",
    createdAt: new Date("2024-07-02").getTime(), dateLabel: "2 Jul 2024",
    tenantDimensions: { responsiveness: 5, maintenance: 5, fairness: 5, communication: 5 },
  },
];

// ---------------------------------------------------------------------------
// Reliability tiers — used wherever a tenant's payment reliability is shown.
// ---------------------------------------------------------------------------
// Three-tier shared vocabulary. The thresholds and colour tokens are the
// single source of truth: pill chrome, strip colouring, and copy all read
// from here so the tier language stays coherent across the product.
export type ReliabilityTier = "reliable" | "mostly-reliable" | "inconsistent";

export interface ReliabilityTierSpec {
  id: ReliabilityTier;
  label: string;                 // "Reliable" etc — used in the pill.
  minPercentage: number;         // inclusive lower bound (0-100).
  pillBg: string;
  pillText: string;
  stripOnTime: string;           // bar colour when segment is on-time.
  stripLate: string;             // bar colour when segment is late.
}

export const RELIABILITY_TIERS: Record<ReliabilityTier, ReliabilityTierSpec> = {
  reliable: {
    id: "reliable",
    label: "Reliable",
    minPercentage: 95,
    pillBg: "#EAF3DE",
    pillText: "#27500A",
    stripOnTime: "#639922",
    stripLate: "#E24B4A",
  },
  "mostly-reliable": {
    id: "mostly-reliable",
    label: "Mostly reliable",
    minPercentage: 80,
    pillBg: "#FAEEDA",
    pillText: "#854F0B",
    stripOnTime: "#639922",
    stripLate: "#E24B4A",
  },
  inconsistent: {
    id: "inconsistent",
    label: "Inconsistent",
    minPercentage: 0,
    pillBg: "#FCEBEB",
    pillText: "#A32D2D",
    stripOnTime: "#639922",
    stripLate: "#E24B4A",
  },
};

// ---------------------------------------------------------------------------
// Utilities — tenant-reliability-shaped view.
// ---------------------------------------------------------------------------
// A Utility carries its current bill plus per-tenant payment history. For a
// single-let tenancy the "per-tenant" map has exactly one entry keyed by the
// synthetic tenant id (`${propId}-tenant`). For HMO, each HMO_TENANTS id.
export type UtilityType =
  | "electricity" | "gas" | "water" | "broadband" | "council-tax";

export type BillTenantStatus = "paid" | "pending" | "late" | "not-due";

// One month's record across all tenants on a given utility.
export interface UtilityMonthlyRecord {
  month: string;       // "Mar"
  monthIso: string;    // "2026-03"
  dueDate: string;     // "28 Mar 2026" — human label
  perTenant: Record<string, {
    amount: number;
    status: "paid" | "late";
    paidDate?: string;  // "26 Mar 2026"
    daysLate?: number;  // populated when late
    daysEarly?: number; // populated when paid before due date
  }>;
}

export interface Utility {
  id: string;
  type: UtilityType;
  typeLabel: string;     // "Electricity" — display label
  provider: string;
  currentBill: {
    amount: number;
    billDate: string;    // "1 Apr 2026"
    dueDate: string;     // "12 Apr 2026"
    dueDateIso: string;  // "2026-04-12" — used for day math
    perTenant: Record<string, {
      amount: number;
      status: BillTenantStatus;
      paidDate?: string;
      daysLate?: number;
      daysEarly?: number;
    }>;
  };
  // Proportional split if uneven; omit for equal split across all tenants
  // in HMO_TENANTS[propId]. Values don't need to sum to 1 — ratio only.
  splitConfig?: Record<string, number>;
  paymentHistory: UtilityMonthlyRecord[];
  // True when this row is a stub created by a tenant setup task — the
  // account's been linked but no bill has arrived yet. Consumers render a
  // muted "Not yet set up" state and skip reliability rendering.
  placeholder?: boolean;
}

// Seed data. Histories cover Nov 2025 – Mar 2026 (5 months) plus an
// in-progress April 2026 captured on the currentBill — together the
// reliability helpers see a 6-month window anchored on today (2026-04-19).
//
// Single-let p2 (James Okafor): one late water payment in Feb plus a
// 14-days-late water bill this month → 22/24 = 91.7% → "Mostly reliable".
// HMO p3 (Mia / Kwame / Sofia): Mia + Kwame perfect; Sofia has two late
// broadband records (Jan + Apr) → 22/24 = 91.7% → "Mostly reliable".
export const PROPERTY_UTILITIES: Record<string, Utility[]> = {
  // p1 is pre-move-in — no utilities set up yet.
  p1: [],

  p2: [
    {
      id: "p2-u-elec",
      type: "electricity",
      typeLabel: "Electricity",
      provider: "Octopus Energy",
      currentBill: {
        amount: 128,
        billDate: "1 Apr 2026",
        dueDate: "15 Apr 2026",
        dueDateIso: "2026-04-15",
        perTenant: {
          "p2-tenant": { amount: 128, status: "paid", paidDate: "14 Apr 2026", daysEarly: 1 },
        },
      },
      paymentHistory: [
        { month: "Nov", monthIso: "2025-11", dueDate: "15 Nov 2025", perTenant: { "p2-tenant": { amount: 118, status: "paid", paidDate: "13 Nov 2025", daysEarly: 2 } } },
        { month: "Dec", monthIso: "2025-12", dueDate: "15 Dec 2025", perTenant: { "p2-tenant": { amount: 142, status: "paid", paidDate: "14 Dec 2025", daysEarly: 1 } } },
        { month: "Jan", monthIso: "2026-01", dueDate: "15 Jan 2026", perTenant: { "p2-tenant": { amount: 154, status: "paid", paidDate: "15 Jan 2026" } } },
        { month: "Feb", monthIso: "2026-02", dueDate: "15 Feb 2026", perTenant: { "p2-tenant": { amount: 138, status: "paid", paidDate: "14 Feb 2026", daysEarly: 1 } } },
        { month: "Mar", monthIso: "2026-03", dueDate: "15 Mar 2026", perTenant: { "p2-tenant": { amount: 124, status: "paid", paidDate: "13 Mar 2026", daysEarly: 2 } } },
      ],
    },
    {
      id: "p2-u-gas",
      type: "gas",
      typeLabel: "Gas",
      provider: "Octopus Energy",
      currentBill: {
        amount: 64,
        billDate: "1 Apr 2026",
        dueDate: "28 Apr 2026",
        dueDateIso: "2026-04-28",
        perTenant: {
          "p2-tenant": { amount: 64, status: "not-due" },
        },
      },
      paymentHistory: [
        { month: "Nov", monthIso: "2025-11", dueDate: "28 Nov 2025", perTenant: { "p2-tenant": { amount: 82, status: "paid", paidDate: "27 Nov 2025", daysEarly: 1 } } },
        { month: "Dec", monthIso: "2025-12", dueDate: "28 Dec 2025", perTenant: { "p2-tenant": { amount: 96, status: "paid", paidDate: "27 Dec 2025", daysEarly: 1 } } },
        { month: "Jan", monthIso: "2026-01", dueDate: "28 Jan 2026", perTenant: { "p2-tenant": { amount: 104, status: "paid", paidDate: "28 Jan 2026" } } },
        { month: "Feb", monthIso: "2026-02", dueDate: "28 Feb 2026", perTenant: { "p2-tenant": { amount: 88, status: "paid", paidDate: "27 Feb 2026", daysEarly: 1 } } },
        { month: "Mar", monthIso: "2026-03", dueDate: "28 Mar 2026", perTenant: { "p2-tenant": { amount: 71, status: "paid", paidDate: "28 Mar 2026" } } },
      ],
    },
    {
      id: "p2-u-water",
      type: "water",
      typeLabel: "Water",
      provider: "Thames Water",
      currentBill: {
        amount: 42,
        billDate: "1 Apr 2026",
        dueDate: "12 Apr 2026",
        dueDateIso: "2026-04-12",
        perTenant: {
          "p2-tenant": { amount: 42, status: "late", daysLate: 7 },
        },
      },
      paymentHistory: [
        { month: "Nov", monthIso: "2025-11", dueDate: "12 Nov 2025", perTenant: { "p2-tenant": { amount: 42, status: "paid", paidDate: "12 Nov 2025" } } },
        { month: "Dec", monthIso: "2025-12", dueDate: "12 Dec 2025", perTenant: { "p2-tenant": { amount: 42, status: "paid", paidDate: "11 Dec 2025", daysEarly: 1 } } },
        { month: "Jan", monthIso: "2026-01", dueDate: "12 Jan 2026", perTenant: { "p2-tenant": { amount: 42, status: "paid", paidDate: "12 Jan 2026" } } },
        { month: "Feb", monthIso: "2026-02", dueDate: "12 Feb 2026", perTenant: { "p2-tenant": { amount: 42, status: "late", paidDate: "18 Feb 2026", daysLate: 6 } } },
        { month: "Mar", monthIso: "2026-03", dueDate: "12 Mar 2026", perTenant: { "p2-tenant": { amount: 42, status: "paid", paidDate: "11 Mar 2026", daysEarly: 1 } } },
      ],
    },
    {
      id: "p2-u-broadband",
      type: "broadband",
      typeLabel: "Broadband",
      provider: "BT",
      currentBill: {
        amount: 30,
        billDate: "1 Apr 2026",
        dueDate: "5 Apr 2026",
        dueDateIso: "2026-04-05",
        perTenant: {
          "p2-tenant": { amount: 30, status: "paid", paidDate: "5 Apr 2026" },
        },
      },
      paymentHistory: [
        { month: "Nov", monthIso: "2025-11", dueDate: "5 Nov 2025", perTenant: { "p2-tenant": { amount: 30, status: "paid", paidDate: "5 Nov 2025" } } },
        { month: "Dec", monthIso: "2025-12", dueDate: "5 Dec 2025", perTenant: { "p2-tenant": { amount: 30, status: "paid", paidDate: "4 Dec 2025", daysEarly: 1 } } },
        { month: "Jan", monthIso: "2026-01", dueDate: "5 Jan 2026", perTenant: { "p2-tenant": { amount: 30, status: "paid", paidDate: "5 Jan 2026" } } },
        { month: "Feb", monthIso: "2026-02", dueDate: "5 Feb 2026", perTenant: { "p2-tenant": { amount: 30, status: "paid", paidDate: "4 Feb 2026", daysEarly: 1 } } },
        { month: "Mar", monthIso: "2026-03", dueDate: "5 Mar 2026", perTenant: { "p2-tenant": { amount: 30, status: "paid", paidDate: "5 Mar 2026" } } },
      ],
    },
  ],

  p3: [
    {
      id: "p3-u-elec",
      type: "electricity",
      typeLabel: "Electricity",
      provider: "Octopus Energy",
      currentBill: {
        amount: 142,
        billDate: "1 Apr 2026",
        dueDate: "12 Apr 2026",
        dueDateIso: "2026-04-12",
        perTenant: {
          ht1: { amount: 47, status: "paid", paidDate: "10 Apr 2026", daysEarly: 2 },
          ht2: { amount: 47, status: "paid", paidDate: "11 Apr 2026", daysEarly: 1 },
          ht3: { amount: 48, status: "paid", paidDate: "12 Apr 2026" },
        },
      },
      paymentHistory: [
        { month: "Nov", monthIso: "2025-11", dueDate: "12 Nov 2025", perTenant: {
          ht1: { amount: 43, status: "paid", paidDate: "11 Nov 2025", daysEarly: 1 },
          ht2: { amount: 43, status: "paid", paidDate: "10 Nov 2025", daysEarly: 2 },
          ht3: { amount: 44, status: "paid", paidDate: "12 Nov 2025" },
        } },
        { month: "Dec", monthIso: "2025-12", dueDate: "12 Dec 2025", perTenant: {
          ht1: { amount: 58, status: "paid", paidDate: "11 Dec 2025", daysEarly: 1 },
          ht2: { amount: 58, status: "paid", paidDate: "12 Dec 2025" },
          ht3: { amount: 59, status: "paid", paidDate: "12 Dec 2025" },
        } },
        { month: "Jan", monthIso: "2026-01", dueDate: "12 Jan 2026", perTenant: {
          ht1: { amount: 62, status: "paid", paidDate: "12 Jan 2026" },
          ht2: { amount: 62, status: "paid", paidDate: "11 Jan 2026", daysEarly: 1 },
          ht3: { amount: 63, status: "paid", paidDate: "12 Jan 2026" },
        } },
        { month: "Feb", monthIso: "2026-02", dueDate: "12 Feb 2026", perTenant: {
          ht1: { amount: 55, status: "paid", paidDate: "11 Feb 2026", daysEarly: 1 },
          ht2: { amount: 55, status: "paid", paidDate: "12 Feb 2026" },
          ht3: { amount: 56, status: "paid", paidDate: "12 Feb 2026" },
        } },
        { month: "Mar", monthIso: "2026-03", dueDate: "12 Mar 2026", perTenant: {
          ht1: { amount: 49, status: "paid", paidDate: "11 Mar 2026", daysEarly: 1 },
          ht2: { amount: 49, status: "paid", paidDate: "12 Mar 2026" },
          ht3: { amount: 50, status: "paid", paidDate: "12 Mar 2026" },
        } },
      ],
    },
    {
      id: "p3-u-gas",
      type: "gas",
      typeLabel: "Gas",
      provider: "Octopus Energy",
      currentBill: {
        amount: 78,
        billDate: "1 Apr 2026",
        dueDate: "12 Apr 2026",
        dueDateIso: "2026-04-12",
        perTenant: {
          ht1: { amount: 26, status: "paid", paidDate: "10 Apr 2026", daysEarly: 2 },
          ht2: { amount: 26, status: "paid", paidDate: "11 Apr 2026", daysEarly: 1 },
          ht3: { amount: 26, status: "paid", paidDate: "12 Apr 2026" },
        },
      },
      paymentHistory: [
        { month: "Nov", monthIso: "2025-11", dueDate: "12 Nov 2025", perTenant: {
          ht1: { amount: 28, status: "paid", paidDate: "11 Nov 2025", daysEarly: 1 },
          ht2: { amount: 28, status: "paid", paidDate: "10 Nov 2025", daysEarly: 2 },
          ht3: { amount: 28, status: "paid", paidDate: "12 Nov 2025" },
        } },
        { month: "Dec", monthIso: "2025-12", dueDate: "12 Dec 2025", perTenant: {
          ht1: { amount: 32, status: "paid", paidDate: "11 Dec 2025", daysEarly: 1 },
          ht2: { amount: 32, status: "paid", paidDate: "12 Dec 2025" },
          ht3: { amount: 32, status: "paid", paidDate: "12 Dec 2025" },
        } },
        { month: "Jan", monthIso: "2026-01", dueDate: "12 Jan 2026", perTenant: {
          ht1: { amount: 34, status: "paid", paidDate: "12 Jan 2026" },
          ht2: { amount: 34, status: "paid", paidDate: "11 Jan 2026", daysEarly: 1 },
          ht3: { amount: 34, status: "paid", paidDate: "12 Jan 2026" },
        } },
        { month: "Feb", monthIso: "2026-02", dueDate: "12 Feb 2026", perTenant: {
          ht1: { amount: 30, status: "paid", paidDate: "11 Feb 2026", daysEarly: 1 },
          ht2: { amount: 30, status: "paid", paidDate: "12 Feb 2026" },
          ht3: { amount: 30, status: "paid", paidDate: "12 Feb 2026" },
        } },
        { month: "Mar", monthIso: "2026-03", dueDate: "12 Mar 2026", perTenant: {
          ht1: { amount: 27, status: "paid", paidDate: "11 Mar 2026", daysEarly: 1 },
          ht2: { amount: 27, status: "paid", paidDate: "12 Mar 2026" },
          ht3: { amount: 27, status: "paid", paidDate: "12 Mar 2026" },
        } },
      ],
    },
    {
      id: "p3-u-water",
      type: "water",
      typeLabel: "Water",
      provider: "Thames Water",
      currentBill: {
        amount: 54,
        billDate: "1 Apr 2026",
        dueDate: "22 Apr 2026",
        dueDateIso: "2026-04-22",
        perTenant: {
          ht1: { amount: 18, status: "not-due" },
          ht2: { amount: 18, status: "not-due" },
          ht3: { amount: 18, status: "not-due" },
        },
      },
      paymentHistory: [
        { month: "Nov", monthIso: "2025-11", dueDate: "22 Nov 2025", perTenant: {
          ht1: { amount: 18, status: "paid", paidDate: "21 Nov 2025", daysEarly: 1 },
          ht2: { amount: 18, status: "paid", paidDate: "20 Nov 2025", daysEarly: 2 },
          ht3: { amount: 18, status: "paid", paidDate: "22 Nov 2025" },
        } },
        { month: "Dec", monthIso: "2025-12", dueDate: "22 Dec 2025", perTenant: {
          ht1: { amount: 18, status: "paid", paidDate: "21 Dec 2025", daysEarly: 1 },
          ht2: { amount: 18, status: "paid", paidDate: "22 Dec 2025" },
          ht3: { amount: 18, status: "paid", paidDate: "22 Dec 2025" },
        } },
        { month: "Jan", monthIso: "2026-01", dueDate: "22 Jan 2026", perTenant: {
          ht1: { amount: 18, status: "paid", paidDate: "22 Jan 2026" },
          ht2: { amount: 18, status: "paid", paidDate: "21 Jan 2026", daysEarly: 1 },
          ht3: { amount: 18, status: "paid", paidDate: "22 Jan 2026" },
        } },
        { month: "Feb", monthIso: "2026-02", dueDate: "22 Feb 2026", perTenant: {
          ht1: { amount: 18, status: "paid", paidDate: "21 Feb 2026", daysEarly: 1 },
          ht2: { amount: 18, status: "paid", paidDate: "22 Feb 2026" },
          ht3: { amount: 18, status: "paid", paidDate: "22 Feb 2026" },
        } },
        { month: "Mar", monthIso: "2026-03", dueDate: "22 Mar 2026", perTenant: {
          ht1: { amount: 18, status: "paid", paidDate: "21 Mar 2026", daysEarly: 1 },
          ht2: { amount: 18, status: "paid", paidDate: "22 Mar 2026" },
          ht3: { amount: 18, status: "paid", paidDate: "22 Mar 2026" },
        } },
      ],
    },
    {
      id: "p3-u-broadband",
      type: "broadband",
      typeLabel: "Broadband",
      provider: "BT",
      currentBill: {
        amount: 38,
        billDate: "1 Apr 2026",
        dueDate: "5 Apr 2026",
        dueDateIso: "2026-04-05",
        perTenant: {
          ht1: { amount: 13, status: "paid", paidDate: "4 Apr 2026", daysEarly: 1 },
          ht2: { amount: 13, status: "paid", paidDate: "5 Apr 2026" },
          ht3: { amount: 12, status: "late", daysLate: 14 },
        },
      },
      paymentHistory: [
        { month: "Nov", monthIso: "2025-11", dueDate: "5 Nov 2025", perTenant: {
          ht1: { amount: 13, status: "paid", paidDate: "5 Nov 2025" },
          ht2: { amount: 13, status: "paid", paidDate: "4 Nov 2025", daysEarly: 1 },
          ht3: { amount: 12, status: "paid", paidDate: "5 Nov 2025" },
        } },
        { month: "Dec", monthIso: "2025-12", dueDate: "5 Dec 2025", perTenant: {
          ht1: { amount: 13, status: "paid", paidDate: "4 Dec 2025", daysEarly: 1 },
          ht2: { amount: 13, status: "paid", paidDate: "5 Dec 2025" },
          ht3: { amount: 12, status: "paid", paidDate: "5 Dec 2025" },
        } },
        { month: "Jan", monthIso: "2026-01", dueDate: "5 Jan 2026", perTenant: {
          ht1: { amount: 13, status: "paid", paidDate: "5 Jan 2026" },
          ht2: { amount: 13, status: "paid", paidDate: "4 Jan 2026", daysEarly: 1 },
          ht3: { amount: 12, status: "late", paidDate: "13 Jan 2026", daysLate: 8 },
        } },
        { month: "Feb", monthIso: "2026-02", dueDate: "5 Feb 2026", perTenant: {
          ht1: { amount: 13, status: "paid", paidDate: "4 Feb 2026", daysEarly: 1 },
          ht2: { amount: 13, status: "paid", paidDate: "5 Feb 2026" },
          ht3: { amount: 12, status: "paid", paidDate: "5 Feb 2026" },
        } },
        { month: "Mar", monthIso: "2026-03", dueDate: "5 Mar 2026", perTenant: {
          ht1: { amount: 13, status: "paid", paidDate: "4 Mar 2026", daysEarly: 1 },
          ht2: { amount: 13, status: "paid", paidDate: "5 Mar 2026" },
          ht3: { amount: 12, status: "paid", paidDate: "5 Mar 2026" },
        } },
      ],
    },
  ],
};
