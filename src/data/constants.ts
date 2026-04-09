// Property & tenant data for the prototype

export const PHASES = ["Pre-Move-In", "Move-In", "During Tenancy", "Move-Out", "Post-Tenancy"] as const;

export interface Property {
  id: string;
  address: string;
  tenant: string;
  rent: number;
  status: "active" | "vacant";
  compliance: number;
  nextDeadline: string;
  depositRef: string | null;
  depositScheme: string | null;
  verified: boolean;
  contractUploaded: boolean;
  isHmo?: boolean;
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
  owner: string;
  status: "pending" | "uploaded";
  timestamp?: string;
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
}

export const PORTFOLIO: Property[] = [
  { id: "p1", address: "14 Elmwood Road, London SE4 2BN", tenant: "Sarah Mitchell", rent: 1450, status: "active", compliance: 0, nextDeadline: "Gas cert renewal — 14 Jun 2026", depositRef: "MD2024-88421", depositScheme: "MyDeposits", verified: true, contractUploaded: true },
  { id: "p2", address: "7 Crane Wharf, Greenwich SE10 0LN", tenant: "James Okafor", rent: 1800, status: "active", compliance: 0, nextDeadline: "EPC renewal overdue", depositRef: "DPS2025-11043", depositScheme: "DPS", verified: true, contractUploaded: true },
  { id: "p3", address: "3 Saffron Court, Hackney E8 1QP", tenant: "3 tenants", rent: 1870, status: "active", compliance: 0, nextDeadline: "No actions due", depositRef: null, depositScheme: null, verified: true, contractUploaded: true, isHmo: true },
];

export const TENANT_INFO: Record<string, TenantInfo> = {
  p1: { name: "Sarah Mitchell", avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face", rating: 4.9, reviewCount: 3, verified: true, since: "February 2026", email: "s.mitchell@email.com" },
  p2: { name: "James Okafor", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face", rating: 4.7, reviewCount: 5, verified: true, since: "March 2025", email: "j.okafor@email.com" },
};

export const PROP_CONTRACT: Record<string, { start: string; end: string; notice: string; type: string }> = {
  p1: { start: "01 Feb 2026", end: "31 Jan 2027", notice: "2 months", type: "Assured Shorthold Tenancy" },
  p2: { start: "15 Mar 2025", end: "14 Mar 2026", notice: "2 months", type: "Assured Shorthold Tenancy" },
  p3: { start: "01 Jan 2026", end: "31 Dec 2026", notice: "2 months", type: "HMO — Multiple ASTs" },
};

export const DOC_VALIDITY_BY_PROP: Record<string, Record<string, DocValidity>> = {
  p1: {
    "Gas Safety Certificate": { expiry: "13 Jun 2026", days: 81, status: "expiring" },
    "EPC Certificate": { expiry: "03 Mar 2034", days: 2900, status: "valid" },
    "EICR Report": { expiry: "20 Jan 2030", days: 1400, status: "valid" },
    "Tenancy Agreement (AST)": { expiry: "31 Jan 2027", days: 312, status: "valid" },
    "Deposit Protection Certificate": { expiry: "01 Feb 2027", days: 313, status: "valid" },
  },
  p2: {
    "Gas Safety Certificate": { expiry: "15 Sep 2026", days: 170, status: "valid" },
    "EPC Certificate": { expiry: "01 Mar 2026", days: -27, status: "expired" },
    "EICR Report": { expiry: "20 Jan 2030", days: 1400, status: "valid" },
    "Tenancy Agreement (AST)": { expiry: "14 Mar 2027", days: 352, status: "valid" },
    "Deposit Protection Certificate": { expiry: "15 Mar 2027", days: 353, status: "valid" },
  },
  p3: {
    "Gas Safety Certificate": { expiry: "01 Dec 2026", days: 248, status: "valid" },
    "EPC Certificate": { expiry: "15 Nov 2033", days: 2790, status: "valid" },
    "EICR Report": { expiry: "10 Jun 2030", days: 1540, status: "valid" },
    "Tenancy Agreement (AST)": { expiry: "31 Dec 2026", days: 278, status: "valid" },
    "Deposit Protection Certificate": { expiry: "01 Jan 2027", days: 279, status: "valid" },
  },
};

export const HMO_TENANTS: Record<string, Array<{
  id: string; name: string; rent: number; deposit: number; depositScheme: string;
  depositRef: string; leaseStart: string; leaseEnd: string; avatarUrl: string;
  verified: boolean; since: string; email: string; tasksDone: number; tasksTotal: number;
  rating: number; reviewCount: number;
}>> = {
  p3: [
    { id: "ht1", name: "Mia Chen", rent: 650, deposit: 650, depositScheme: "MyDeposits", depositRef: "MD2026-33101", leaseStart: "01 Jan 2026", leaseEnd: "31 Dec 2026", avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face", verified: true, since: "January 2026", email: "m.chen@email.com", tasksDone: 8, tasksTotal: 12, rating: 4.8, reviewCount: 3 },
    { id: "ht2", name: "Kwame Asante", rent: 620, deposit: 620, depositScheme: "DPS", depositRef: "DPS2026-44205", leaseStart: "15 Feb 2026", leaseEnd: "14 Feb 2027", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face", verified: true, since: "February 2026", email: "k.asante@email.com", tasksDone: 5, tasksTotal: 12, rating: 4.5, reviewCount: 2 },
    { id: "ht3", name: "Sofia Rossi", rent: 600, deposit: 600, depositScheme: "MyDeposits", depositRef: "MD2026-33209", leaseStart: "01 Mar 2026", leaseEnd: "28 Feb 2027", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face", verified: true, since: "March 2026", email: "s.rossi@email.com", tasksDone: 3, tasksTotal: 12, rating: 4.2, reviewCount: 1 },
  ],
};

export const PROP_ALERTS: Record<string, { text: string; severity: "high" | "medium"; action: string; linkedTab?: string; linkedPhaseIdx?: number }[]> = {
  p1: [
    { text: "Gas Safety Certificate expiring in 90 days", severity: "medium", action: "Schedule", linkedTab: "vault", linkedPhaseIdx: 2 },
    { text: "Renters' Rights Act 2024 — contract review required", severity: "high", action: "Review", linkedTab: "tasks", linkedPhaseIdx: 2 },
  ],
  p2: [
    { text: "EPC renewal overdue — legal requirement", severity: "high", action: "Renew Now", linkedTab: "vault", linkedPhaseIdx: 2 },
  ],
  p3: [],
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
      { id: "t1", label: "Review & sign tenancy agreement", type: "legal", detail: "Sign tenancy agreement electronically.", isContractSign: true },
      { id: "t2", label: "Pay & log holding deposit", type: "legal", detail: "Payment verified and timestamped." },
      { id: "t3", label: "Pay security deposit", type: "legal", detail: "Full deposit verified." },
      { id: "t5", label: "Confirm receipt of 'How to Rent' guide", type: "legal", detail: "Confirm you have read and received the guide." },
      { id: "t6", label: "Confirm move-in date", type: "suggested", detail: "Agree move-in date with landlord." },
    ],
    "Move-In": [
      { id: "t7", label: "Report pre-existing damage", type: "suggested", detail: "Log and photograph any damage.", hasChat: true, chatContext: "Pre-existing Damage" },
      { id: "t8", label: "Take & upload move-in photos", type: "suggested", detail: "Timestamped photos.", vaultDoc: "Move-In Photos" },
      { id: "t9", label: "Review & confirm move-in inventory", type: "suggested", detail: "Confirm each item." },
      { id: "t11", label: "Confirm smoke & CO alarm tested", type: "legal", detail: "Confirm alarms are working on move-in day." },
      { id: "t_u1", label: "Set up energy supplier", type: "suggested", detail: "Register with your energy provider." },
      { id: "t_u2", label: "Set up water account", type: "suggested", detail: "Contact your water authority." },
      { id: "t_u3", label: "Set up broadband", type: "suggested", detail: "Arrange broadband connection." },
      { id: "t_g1", label: "Register for council tax", type: "legal", detail: "Register as liable person." },
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
};

export const VAULT_INIT: VaultDoc[] = [
  { id: "v1", name: "Tenancy Agreement (AST)", desc: "The binding contract.", owner: "landlord", status: "pending" },
  { id: "v2", name: "Gas Safety Certificate", desc: "Annual check by a Gas Safe engineer.", owner: "landlord", status: "pending" },
  { id: "v3", name: "EPC Certificate", desc: "Energy performance rating.", owner: "landlord", status: "pending" },
  { id: "v4", name: "EICR Report", desc: "Electrical installation report.", owner: "landlord", status: "pending" },
  { id: "v5", name: "How to Rent Guide", desc: "Government guide for tenants.", owner: "landlord", status: "pending" },
  { id: "v6", name: "Move-In Inventory", desc: "Condition record of every item.", owner: "both", status: "pending" },
  { id: "v7", name: "Move-In Photos", desc: "Timestamped photos.", owner: "tenant", status: "pending" },
  { id: "v8", name: "Move-Out Photos", desc: "Condition comparison at end.", owner: "both", status: "pending" },
  { id: "v9", name: "Deposit Protection Certificate", desc: "TDP scheme certificate.", owner: "landlord", status: "pending" },
];

// Completed task IDs for p2 and p3 (demo data)
export const COMPLETED_INIT: Record<string, boolean> = {
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
export const PROP_PHOTOS: Record<string, { label: string; src: string }[]> = {
  p1: [
    { label: "Living Room", src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop" },
    { label: "Kitchen", src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop" },
    { label: "Bathroom", src: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop" },
  ],
  p2: [
    { label: "Bedroom", src: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop" },
    { label: "Kitchen", src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop" },
    { label: "Living", src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop" },
  ],
  p3: [
    { label: "Living Room", src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop" },
    { label: "Bedroom", src: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop" },
    { label: "Kitchen", src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop" },
  ],
};

export const PROP_RATINGS: Record<string, { rating: number; count: number }> = {
  p1: { rating: 4.9, count: 3 },
  p2: { rating: 4.7, count: 5 },
  p3: { rating: 4.6, count: 6 },
};
