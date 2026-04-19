// UK landlord task library — researched per gov.uk, Shelter, NRLA guidance.
// Each entry powers the Tasks tab detail panel: copy, consequences, steps, actions.

export type TaskCategory = "time-bound-legal" | "required-legal" | "recommended";
export type TaskAction =
  | { kind: "upload"; label: string; vaultDoc: string }
  | { kind: "external"; label: string; href: string }
  | { kind: "remind"; label: string }
  | { kind: "mark-done"; label: string };

export interface TaskLibraryEntry {
  // The category drives grouping in the list
  category: TaskCategory;
  // Subtitle shown under the title in the row
  subtitle: string;
  // Short plain-English description of what's needed
  description: (ctx: TaskCtx) => string;
  // The "If missed" consequence prose (red block)
  consequence?: (ctx: TaskCtx) => string;
  // Numbered steps shown in "How this works"
  steps: string[];
  // Extra context rows in the detail panel (label/value)
  contextRows: (ctx: TaskCtx) => { label: string; value: string }[];
  // Actions stack at the bottom of the panel (first is primary)
  actions: TaskAction[];
  // Urgency anchor, in days. Negative = overdue. Used for the row pill.
  // Returns null if not a time-bound task (shows "—").
  daysRemaining: (ctx: TaskCtx) => number | null;
  // Statutory tag shown next to the urgency pill
  statutory: boolean;
}

// Context passed to library callbacks — derived from the property + tenant.
export interface TaskCtx {
  tenantName: string;
  tenantFirstName: string;
  rent: number;
  deposit: number; // capped at 5 weeks for rent < £50k/yr, else 6 weeks
  contractStart: string; // human date, e.g. "01 Feb 2026"
  isHmo: boolean;
  propertyAddress: string;
}

// --- helpers ---------------------------------------------------------------

const gbp = (n: number) => `£${n.toLocaleString("en-GB")}`;

// --- library ---------------------------------------------------------------

export const TASK_LIBRARY: Record<string, TaskLibraryEntry> = {
  // === TIME-BOUND LEGAL ====================================================

  // l0 — Upload Tenancy Agreement. This is the gate: until the AST is filed,
  // every downstream obligation (deposit protection window, EPC, gas, etc.)
  // has no anchor date. Uploading here also triggers the mock AI extraction
  // so the rest of the product picks up tenant, rent and term.
  // daysRemaining returns -1 so it always sits at the top of the urgency
  // ranking — l0 is the prerequisite for every other pre-move-in action,
  // so "most overdue" is the right semantic even when it has no real deadline.
  l0: {
    category: "time-bound-legal",
    subtitle: "Required before any other pre-move-in task",
    statutory: true,
    description: (c) =>
      `Upload the signed Assured Shorthold Tenancy between you and ${c.tenantFirstName}. Once filed, HomeBound extracts the key dates — start, end, rent, deposit — and every downstream task (deposit registration, EPC, gas safety) anchors to them.`,
    consequence: () =>
      "Without a filed tenancy agreement there's no legally binding contract on record. The move-in can't proceed and the statutory clocks (30-day deposit registration, Gas Safety, How-to-Rent) have nothing to start from.",
    steps: [
      "Sign the AST with the tenant (digital signature or scan of wet signature).",
      "Upload the PDF here — HomeBound files it in the Vault automatically.",
      "Key facts (rent, term, notice period) are extracted so the other tasks unlock with real dates.",
    ],
    contextRows: (c) => [
      { label: "Tenant", value: c.tenantName },
      { label: "Rent", value: `${gbp(c.rent)}/month` },
      { label: "Start", value: c.contractStart },
    ],
    actions: [
      { kind: "upload", label: "Upload tenancy agreement", vaultDoc: "Tenancy Agreement (AST)" },
      { kind: "remind", label: "Remind me" },
    ],
    daysRemaining: () => null,
  },

  l1: {
    category: "time-bound-legal",
    subtitle: "Statutory · 30 days from receipt",
    statutory: true,
    description: (c) =>
      `${c.tenantFirstName}'s ${gbp(c.deposit)} deposit must be protected with a government-approved scheme within 30 days of receipt. You must also serve the prescribed information about the scheme used.`,
    consequence: (c) =>
      `You lose the right to serve a Section 21 (no-fault) notice. ${c.tenantFirstName} could claim 1× to 3× the deposit (up to ${gbp(c.deposit * 3)}) through the courts.`,
    steps: [
      "Register with a TDP scheme (DPS, MyDeposits, or TDS).",
      "Protect the deposit and receive a certificate.",
      "Serve the prescribed information to the tenant within 30 days.",
      "Upload the certificate here to mark this done.",
    ],
    contextRows: (c) => [
      { label: "Deposit amount", value: `${gbp(c.deposit)} · received ${c.contractStart}` },
      { label: "Statutory deadline", value: addDays(c.contractStart, 30) },
      { label: "Tenant", value: c.tenantName },
    ],
    actions: [
      { kind: "upload", label: "Upload certificate", vaultDoc: "Deposit Protection Certificate" },
      { kind: "external", label: "Open DPS ↗", href: "https://www.depositprotection.com" },
      { kind: "remind", label: "Remind me" },
    ],
    daysRemaining: (c) => daysFromStart(c.contractStart, 30),
  },

  l5: {
    category: "time-bound-legal",
    subtitle: "Must reach tenant before move-in",
    statutory: true,
    description: (c) =>
      `${c.tenantFirstName} must receive the latest 'How to Rent' guide (published by HM Government) before the tenancy starts. PDF or printed copy both count, but you need a record of delivery.`,
    consequence: () =>
      "You cannot serve a valid Section 21 (no-fault eviction) notice until the guide has been provided. There is no fine, but it blocks possession proceedings.",
    steps: [
      "Download the latest 'How to Rent' guide from gov.uk.",
      "Email or hand the PDF to the tenant before move-in day.",
      "Ask them to confirm receipt — this creates a timestamped record.",
    ],
    contextRows: (c) => [
      { label: "Must reach tenant by", value: c.contractStart },
      { label: "Tenant", value: c.tenantName },
      { label: "Latest version", value: "October 2023" },
    ],
    actions: [
      { kind: "external", label: "Download from gov.uk ↗", href: "https://www.gov.uk/government/publications/how-to-rent" },
      { kind: "mark-done", label: "Mark as sent" },
      { kind: "remind", label: "Remind me" },
    ],
    daysRemaining: (c) => daysUntil(c.contractStart),
  },

  // === REQUIRED LEGAL (no countdown — must be in place, not date-driven) ===

  l2: {
    category: "required-legal",
    subtitle: "Required before marketing · valid 10 years",
    statutory: true,
    description: () =>
      "An EPC with a minimum rating of E is legally required to let a property in England. From 2028, the minimum is expected to rise to C for new tenancies.",
    consequence: () =>
      "Letting without a valid EPC carries fines from £5,000 up to £30,000 per breach (rising in 2026). Local authorities are actively enforcing.",
    steps: [
      "Book an accredited Domestic Energy Assessor.",
      "Receive your EPC certificate (valid 10 years).",
      "Upload the PDF here. Tenant gets a copy automatically.",
    ],
    contextRows: (c) => [
      { label: "Minimum rating", value: "E (rising to C in 2028)" },
      { label: "Validity", value: "10 years" },
      { label: "Property", value: c.propertyAddress.split(",")[0] },
    ],
    actions: [
      { kind: "upload", label: "Upload EPC", vaultDoc: "EPC Certificate" },
      { kind: "external", label: "Find an assessor ↗", href: "https://www.gov.uk/find-energy-certificate" },
      { kind: "remind", label: "Remind me" },
    ],
    daysRemaining: () => null,
  },

  l3: {
    category: "required-legal",
    subtitle: "Annual · required before move-in",
    statutory: true,
    description: () =>
      "A Gas Safe registered engineer must inspect every gas appliance, fitting and flue annually. The certificate (CP12) must be given to the tenant before they move in, and within 28 days of every subsequent check.",
    consequence: () =>
      "Up to £6,000 per breach. In serious cases (death or injury), unlimited fines and up to 6 months in prison. You also cannot serve a Section 21.",
    steps: [
      "Book a Gas Safe registered engineer.",
      "Receive the CP12 Landlord Gas Safety Record.",
      "Give a copy to the tenant before move-in.",
      "Upload the certificate here.",
    ],
    contextRows: (c) => [
      { label: "Frequency", value: "Every 12 months" },
      { label: "Deadline", value: c.contractStart },
      { label: "Penalty", value: "Up to £6,000 per breach" },
    ],
    actions: [
      { kind: "upload", label: "Upload CP12 certificate", vaultDoc: "Gas Safety Certificate" },
      { kind: "external", label: "Find a Gas Safe engineer ↗", href: "https://www.gassaferegister.co.uk" },
      { kind: "remind", label: "Remind me" },
    ],
    daysRemaining: () => null,
  },

  l4: {
    category: "required-legal",
    subtitle: "5-yearly · required before move-in",
    statutory: true,
    description: () =>
      "Every fixed electrical installation must be inspected by a qualified electrician at least every 5 years. The EICR must be given to the tenant within 28 days of inspection.",
    consequence: () =>
      "Local authority fines of up to £30,000. The council can also force remedial work and recover costs from you.",
    steps: [
      "Book a qualified electrician (NICEIC, NAPIT, or ELECSA registered).",
      "Receive the EICR — must report 'Satisfactory'.",
      "Remediate any C1, C2 or FI codes within 28 days.",
      "Upload the certificate here.",
    ],
    contextRows: (c) => [
      { label: "Frequency", value: "Every 5 years" },
      { label: "Deadline", value: c.contractStart },
      { label: "Penalty", value: "Up to £30,000" },
    ],
    actions: [
      { kind: "upload", label: "Upload EICR", vaultDoc: "EICR Report" },
      { kind: "external", label: "Find an electrician ↗", href: "https://www.niceic.com/find-a-contractor" },
      { kind: "remind", label: "Remind me" },
    ],
    daysRemaining: () => null,
  },

  l_hmo1: {
    category: "required-legal",
    subtitle: "Mandatory for HMOs of 5+ from 2+ households",
    statutory: true,
    description: () =>
      "A mandatory HMO licence is required from the local authority. Some councils (Hackney, Newham, Southwark) require additional or selective licensing for smaller HMOs too.",
    consequence: () =>
      "Unlimited fine on conviction, plus a Rent Repayment Order — tenants can reclaim up to 12 months' rent. You cannot serve a Section 21.",
    steps: [
      "Apply to the local authority for the HMO licence.",
      "Pay the application fee (typically £500–£1,500).",
      "Pass the inspection (fire safety, room sizes, amenities).",
      "Upload the licence here once issued.",
    ],
    contextRows: (c) => [
      { label: "Property type", value: "Licensable HMO" },
      { label: "Issued by", value: extractCouncil(c.propertyAddress) },
      { label: "Renewal", value: "Every 5 years (varies)" },
    ],
    actions: [
      { kind: "upload", label: "Upload HMO licence", vaultDoc: "HMO Licence" },
      { kind: "external", label: "Apply to council ↗", href: "https://www.gov.uk/house-multiple-occupation-licence" },
      { kind: "remind", label: "Remind me" },
    ],
    daysRemaining: () => null,
  },

  // === RECOMMENDED =========================================================

  l6: {
    category: "recommended",
    subtitle: "Protects your deposit claim",
    statutory: false,
    description: () =>
      "A timestamped, photographic inventory is the single strongest evidence in a deposit dispute. Without it, TDP adjudicators almost always find for the tenant.",
    consequence: () =>
      "No legal penalty, but in practice you will lose any disputed deposit deduction. Adjudicators apply the principle: 'no inventory, no deduction'.",
    steps: [
      "Walk through the property room by room.",
      "Photograph every item, surface and existing damage.",
      "Note meter readings and key counts.",
      "Upload here — tenant signs digitally on move-in.",
    ],
    contextRows: (c) => [
      { label: "Status", value: "Recommended best practice" },
      { label: "Used at", value: "Move-in and move-out" },
      { label: "Property", value: c.propertyAddress.split(",")[0] },
    ],
    actions: [
      { kind: "upload", label: "Upload inventory", vaultDoc: "Move-In Inventory" },
      { kind: "remind", label: "Remind me" },
    ],
    daysRemaining: () => null,
  },

  l7: {
    category: "recommended",
    subtitle: "Gas, electricity, water",
    statutory: false,
    description: () =>
      "Photograph every meter on the day of move-in. This protects both parties from utility disputes and locks in the start point for billing.",
    consequence: () =>
      "No legal penalty, but disputed utility bills are common — without photos, the tenant or supplier can challenge the opening read.",
    steps: [
      "On move-in day, photograph each meter clearly.",
      "Note the date, time, and serial numbers.",
      "Send a copy to each utility provider.",
      "Upload here for shared record-keeping.",
    ],
    contextRows: (c) => [
      { label: "When", value: `On ${c.contractStart}` },
      { label: "Status", value: "Recommended best practice" },
    ],
    actions: [
      { kind: "upload", label: "Upload meter photos", vaultDoc: "Meter Reading Photos" },
      { kind: "remind", label: "Remind me" },
    ],
    daysRemaining: () => null,
  },

  // === MOVE-IN =============================================================

  l8: {
    category: "recommended",
    subtitle: "Log date, time, and number of sets",
    statutory: false,
    description: (c) =>
      `Log the key handover on move-in day so there's a timestamped record. Note how many sets ${c.tenantFirstName} received and any access fobs or gate keys.`,
    steps: [
      "Meet the tenant at the property on move-in day.",
      "Hand over keys and any fobs.",
      "Log the date, time, and number of sets in the app.",
    ],
    contextRows: (c) => [
      { label: "Move-in day", value: c.contractStart },
      { label: "Tenant", value: c.tenantName },
    ],
    actions: [
      { kind: "mark-done", label: "Log handover" },
      { kind: "remind", label: "Remind me" },
    ],
    daysRemaining: (c) => daysUntil(c.contractStart),
  },

  l9: {
    category: "required-legal",
    subtitle: "Test smoke & CO alarms on day one",
    statutory: true,
    description: () =>
      "The Smoke & Carbon Monoxide Alarm (England) Regulations require every alarm to be tested on the first day of a new tenancy. Photograph the test and log it as evidence.",
    consequence: () =>
      "Civil penalty up to £5,000 per breach from the local authority. A working test record is the single best evidence you have.",
    steps: [
      "Press-test every smoke alarm on the first day of tenancy.",
      "Press-test every CO alarm in rooms with a solid-fuel appliance.",
      "Photograph the alarms as evidence and upload here.",
    ],
    contextRows: (c) => [
      { label: "When", value: `On ${c.contractStart}` },
      { label: "Evidence", value: "Photos + timestamped log" },
    ],
    actions: [
      { kind: "upload", label: "Upload evidence", vaultDoc: "Smoke & CO Alarm Evidence" },
      { kind: "mark-done", label: "Mark tested" },
      { kind: "remind", label: "Remind me" },
    ],
    daysRemaining: (c) => daysUntil(c.contractStart),
  },

  l10: {
    category: "recommended",
    subtitle: "After the tenant has reviewed the inventory",
    statutory: false,
    description: (c) =>
      `Once ${c.tenantFirstName} has reviewed the move-in inventory and flagged any issues, countersign it to close the record.`,
    steps: [
      "Review the tenant's inventory response.",
      "Resolve any flagged items (photos, notes).",
      "Countersign in the app — both copies are stored in the Vault.",
    ],
    contextRows: (c) => [
      { label: "Tenant", value: c.tenantName },
      { label: "Status", value: "Awaiting tenant review" },
    ],
    actions: [
      { kind: "mark-done", label: "Countersign" },
      { kind: "remind", label: "Remind me" },
    ],
    daysRemaining: () => null,
  },

  // === MOVE-OUT ============================================================

  l16: {
    category: "recommended",
    subtitle: "Compare against the move-in inventory",
    statutory: false,
    description: () =>
      "Walk the property on the agreed check-out date and compare against the move-in inventory. Photograph any changes and note them for the deposit return decision.",
    steps: [
      "Arrange a mutual check-out date with the tenant.",
      "Walk the property with the move-in inventory in hand.",
      "Photograph every discrepancy and log it.",
    ],
    contextRows: (c) => [
      { label: "Tenant", value: c.tenantName },
      { label: "Evidence", value: "Photos + annotated inventory" },
    ],
    actions: [
      { kind: "mark-done", label: "Inspection complete" },
      { kind: "remind", label: "Remind me" },
    ],
    daysRemaining: () => null,
  },

  l17: {
    category: "recommended",
    subtitle: "Timestamped photos only",
    statutory: false,
    description: () =>
      "Upload timestamped photos of any damage, excessive wear, or missing items. These are your evidence in a deposit adjudication.",
    steps: [
      "Photograph every flagged item with timestamps.",
      "Upload the photos to the Vault.",
      "Cross-reference them against the move-in inventory.",
    ],
    contextRows: () => [
      { label: "Evidence type", value: "Timestamped photos" },
      { label: "Used in", value: "Deposit adjudication" },
    ],
    actions: [
      { kind: "upload", label: "Upload photos", vaultDoc: "Move-Out Photos" },
      { kind: "remind", label: "Remind me" },
    ],
    daysRemaining: () => null,
  },

  l18: {
    category: "required-legal",
    subtitle: "Itemised list required by TDP schemes",
    statutory: true,
    description: () =>
      "Any deposit deduction must be itemised — a single line labelled 'damages' will not hold up at adjudication. Reference the move-in inventory, photos, and quotes for each charge.",
    consequence: () =>
      "Adjudicators default to the tenant when evidence is thin. A vague claim is the single most common reason landlords lose deposit disputes.",
    steps: [
      "List each deduction with a short description.",
      "Attach the relevant photos and supplier quotes.",
      "Send the itemised list to the tenant via the app.",
    ],
    contextRows: (c) => [
      { label: "Tenant", value: c.tenantName },
      { label: "Evidence", value: "Itemised list + photos + quotes" },
    ],
    actions: [
      { kind: "mark-done", label: "Submit list" },
      { kind: "external", label: "Open thread ↗", href: "#comms" },
    ],
    daysRemaining: () => null,
  },

  l19: {
    category: "time-bound-legal",
    subtitle: "Statutory · within 10 days of agreement",
    statutory: true,
    description: (c) =>
      `Once deductions are agreed, the remaining deposit must be returned to ${c.tenantFirstName} within 10 days. Late returns are a common cause of county court claims.`,
    consequence: () =>
      "Tenant can raise a county court claim. Interest and costs are typically awarded on top of the deposit.",
    steps: [
      "Agree the deduction amount with the tenant.",
      "Transfer the balance to the tenant's nominated account.",
      "Log the transfer date and reference in the app.",
    ],
    contextRows: (c) => [
      { label: "Tenant", value: c.tenantName },
      { label: "Statutory window", value: "10 days from agreement" },
    ],
    actions: [
      { kind: "mark-done", label: "Mark returned" },
      { kind: "remind", label: "Remind me" },
    ],
    daysRemaining: () => null,
  },

  // === DURING TENANCY (used for p2/p3 active properties) ===================

  l13: {
    category: "time-bound-legal",
    subtitle: "Annual · 12 months from last cert",
    statutory: true,
    description: () =>
      "Gas Safety Certificates expire 12 months after issue. You can renew up to 2 months early without losing your renewal date — book in good time.",
    consequence: () =>
      "Same as initial: up to £6,000 per breach, possible criminal prosecution, blocks Section 21 notices.",
    steps: [
      "Book the Gas Safe engineer 4–6 weeks before expiry.",
      "Provide the engineer with reasonable access.",
      "Receive the new CP12 and forward to tenant within 28 days.",
      "Upload here to refresh the deadline.",
    ],
    contextRows: (c) => [
      { label: "Frequency", value: "Every 12 months" },
      { label: "Renewal window", value: "Up to 2 months early" },
      { label: "Tenant", value: c.tenantName },
    ],
    actions: [
      { kind: "upload", label: "Upload renewed CP12", vaultDoc: "Gas Safety Certificate" },
      { kind: "external", label: "Find a Gas Safe engineer ↗", href: "https://www.gassaferegister.co.uk" },
      { kind: "remind", label: "Remind me" },
    ],
    daysRemaining: () => 81, // matches DOC_VALIDITY for p1
  },

  l22: {
    category: "time-bound-legal",
    subtitle: "Required to keep letting the property",
    statutory: true,
    description: () =>
      "An expired EPC is treated the same as having no EPC — it is illegal to continue letting. Renew before the existing certificate runs out.",
    consequence: () =>
      "Fines from £5,000 to £30,000. The council can also serve a penalty notice for every month of breach.",
    steps: [
      "Book an accredited Domestic Energy Assessor.",
      "Receive the new EPC (valid 10 years).",
      "Upload the PDF — tenant is notified automatically.",
    ],
    contextRows: (c) => [
      { label: "Status", value: "Renewal required" },
      { label: "Validity once renewed", value: "10 years" },
      { label: "Property", value: c.propertyAddress.split(",")[0] },
    ],
    actions: [
      { kind: "upload", label: "Upload renewed EPC", vaultDoc: "EPC Certificate" },
      { kind: "external", label: "Find an assessor ↗", href: "https://www.gov.uk/find-energy-certificate" },
      { kind: "remind", label: "Remind me" },
    ],
    daysRemaining: () => 28, // upcoming EPC renewal window for p2
  },

  l12: {
    category: "recommended",
    subtitle: "Statutory · respond promptly",
    statutory: true,
    description: () =>
      "Under the Homes (Fitness for Human Habitation) Act 2018, landlords must keep the property free from serious hazards. Acknowledge repair requests promptly and act within a reasonable timeframe — urgent repairs (no heat/water) within 24 hours.",
    consequence: () =>
      "Tenants can sue for damages and force repairs via the courts. Fines and rent reductions are common, plus legal costs.",
    steps: [
      "Acknowledge the request within 24 hours.",
      "Arrange inspection or contractor visit.",
      "Complete the repair within a reasonable timeframe.",
      "Confirm completion in the message thread.",
    ],
    contextRows: (c) => [
      { label: "Tenant", value: c.tenantName },
      { label: "Urgent (no heat/water)", value: "Within 24 hours" },
      { label: "Standard repair", value: "Within 28 days" },
    ],
    actions: [
      { kind: "external", label: "Open thread ↗", href: "#comms" },
      { kind: "mark-done", label: "Mark resolved" },
    ],
    daysRemaining: () => null,
  },

  l15: {
    category: "recommended",
    subtitle: "Annual · serve correct notice",
    statutory: true,
    description: () =>
      "Rent increases mid-tenancy require Section 13 notice, with at least one month's notice. The new rent must be reasonable — tenants can challenge it at the First-tier Tribunal.",
    consequence: () =>
      "Invalid notice means the increase is unenforceable. Aggressive increases can be reduced by tribunal, and damage your tenant relationship.",
    steps: [
      "Compare to local market rents.",
      "Discuss informally with the tenant first.",
      "Serve Section 13 notice (one month minimum).",
      "Update the rent ledger here.",
    ],
    contextRows: (c) => [
      { label: "Current rent", value: `${gbp(c.rent)}/mo` },
      { label: "Tenant", value: c.tenantName },
      { label: "Notice required", value: "1 month minimum" },
    ],
    actions: [
      { kind: "external", label: "Open thread ↗", href: "#comms" },
      { kind: "mark-done", label: "Mark agreed" },
    ],
    daysRemaining: () => null,
  },
};

// --- date helpers ----------------------------------------------------------

function parseDate(s: string): Date | null {
  // Expect "DD MMM YYYY"
  const m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (!m) return null;
  const [, d, mon, y] = m;
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const monthIdx = months[mon as keyof typeof months];
  if (monthIdx === undefined) return null;
  return new Date(Number(y), monthIdx, Number(d));
}

function formatDate(d: Date): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${String(d.getDate()).padStart(2,"0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  if (!d) return dateStr;
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

// Reference "today" so the prototype renders consistently. Aligns with p1's
// Feb 2026 contract start (so the deposit task shows ~22 days remaining).
const TODAY = new Date(2026, 2, 13); // 13 Mar 2026

function daysUntil(dateStr: string): number {
  const d = parseDate(dateStr);
  if (!d) return 0;
  return Math.round((d.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
}

function daysFromStart(startStr: string, windowDays: number): number {
  const d = parseDate(startStr);
  if (!d) return windowDays;
  const deadline = new Date(d.getTime() + windowDays * 24 * 60 * 60 * 1000);
  return Math.round((deadline.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
}

function extractCouncil(address: string): string {
  if (/Hackney/i.test(address)) return "Hackney Council";
  if (/Greenwich/i.test(address)) return "Greenwich Council";
  if (/SE4/i.test(address)) return "Lewisham Council";
  return "Local council";
}
