// Mocked but realistic AI legal pre-check + mediator.
// Pattern-matches the draft message text and returns:
//   - severity: "ok" | "info" | "warn"
//   - title + body: human-readable warning
//   - suggestion: a softened/safer rewrite (when applicable)
//
// Real call would be Lovable AI; we keep the shape compatible so swapping is mechanical.

export type LegalSeverity = "ok" | "info" | "warn";

export interface LegalCheck {
  severity: LegalSeverity;
  title: string;
  body: string;
  citation?: string;
  suggestion?: string;
}

const RULES: Array<{
  test: RegExp;
  build: (m: string) => LegalCheck;
}> = [
  {
    // Section 21 references
    test: /\bsection\s*21\b|\bs21\b|no[\s-]*fault eviction/i,
    build: () => ({
      severity: "warn",
      title: "Section 21 timing risk",
      body:
        "Section 21 cannot be served in the first 4 months of a tenancy, and a minimum 2-month notice applies. From the Renters' Rights Act 2024, no-fault eviction is being phased out — your notice may be invalid.",
      citation: "Renters' Rights Act 2024 · Housing Act 1988 s.21",
      suggestion:
        "I'd like to discuss ending the tenancy. Can we arrange a call this week to talk through the options?",
    }),
  },
  {
    // Deposit deduction without inventory
    test: /\bdeduct(ion)?s?\b|\bwithhold\b|keep (the )?deposit/i,
    build: () => ({
      severity: "warn",
      title: "Deposit deduction — evidence required",
      body:
        "Deductions must be itemised, supported by the move-in inventory and dated photos, and proportionate (TDP adjudicators apply 'fair wear and tear'). Without evidence, the tenant can challenge and you'll likely lose.",
      citation: "Housing Act 2004 · TDP scheme rules",
      suggestion:
        "I'd like to discuss some end-of-tenancy costs. I'll share the inventory and photos so we can agree fair amounts together.",
    }),
  },
  {
    // Retaliatory eviction risk after a repair complaint
    test: /\b(complaint|complained|reported|repair)\b.*\b(evict|leave|notice)\b|\b(evict|leave|notice)\b.*\b(complaint|repair)\b/i,
    build: () => ({
      severity: "warn",
      title: "Retaliatory eviction risk",
      body:
        "Issuing notice shortly after a repair complaint can be treated as retaliatory eviction under the Deregulation Act 2015 s.33. A council improvement notice can suspend a Section 21 for 6 months.",
      citation: "Deregulation Act 2015 s.33",
      suggestion:
        "Thanks for raising the repair. I'll get this sorted within the statutory 14-day window and will write separately about anything else.",
    }),
  },
  {
    // Rent increase
    test: /\brent (increase|rise|review)\b|\bincreas(e|ing) (the )?rent\b/i,
    build: () => ({
      severity: "info",
      title: "Rent increase — correct notice required",
      body:
        "For an AST, increases mid-term need tenant agreement or a Section 13 notice (Form 4) with at least 1 month's notice, and increases are limited to once a year. The increase must reflect local market rents.",
      citation: "Housing Act 1988 s.13",
      suggestion: undefined,
    }),
  },
  {
    // Aggressive tone
    test: /\b(immediately|right now|or else|sue|legal action|court)\b/i,
    build: (m) => ({
      severity: "info",
      title: "Tone check",
      body:
        "This message reads as adversarial. A calmer, action-focused message tends to resolve issues faster and creates better evidence if it does reach a tribunal.",
      suggestion: m
        .replace(/\bimmediately\b/gi, "as soon as possible")
        .replace(/\bor else\b/gi, "")
        .replace(/\b(sue|legal action|court)\b/gi, "the next steps")
        .trim(),
    }),
  },
];

export function legalPrecheck(text: string): LegalCheck | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  for (const rule of RULES) {
    if (rule.test.test(trimmed)) return rule.build(trimmed);
  }
  return null;
}

// Mediator: a friendly summary of the last tenant message, with suggested replies.
export interface MediatorBrief {
  summary: string;
  intent: string;
  legalOverview?: string;
  citation?: string;
  suggestedReplies: string[];
}

export type MediatorRole = "landlord" | "tenant";

export function mediatorBriefFor(context: string, role: MediatorRole = "landlord"): MediatorBrief {
  const isLL = role === "landlord";

  if (/repair/i.test(context)) {
    return {
      summary: isLL
        ? "Your tenant has reported a maintenance issue. The 14-day reasonable repair window starts today."
        : "You've opened a repair request. The landlord has a statutory obligation to act within a reasonable time.",
      intent: isLL
        ? "Tenant wants acknowledgement and a timeline."
        : "You want acknowledgement, a fix, and a clear timeline.",
      legalOverview: isLL
        ? "Under Landlord and Tenant Act 1985 s.11, the landlord is responsible for the structure and exterior, installations for water/gas/electricity, sanitation, and space/water heating. The tenant is responsible for minor upkeep (replacing bulbs, unblocking sinks from misuse) and 'tenant-like' behaviour. Urgent issues (no heat/water, serious leaks, electrical danger) should be actioned within days, not weeks."
        : "Under Landlord and Tenant Act 1985 s.11, your landlord must keep the structure, heating, hot water, sanitation, and gas/electric installations in repair. You're responsible for minor upkeep and damage you cause. If repairs aren't done in a reasonable time, you can escalate to the local council's environmental health team.",
      citation: "Landlord and Tenant Act 1985 s.11 · Homes (Fitness for Human Habitation) Act 2018",
      suggestedReplies: isLL
        ? [
            "Thanks for letting me know — I'll arrange a contractor visit this week and will confirm a time within 24 hours.",
            "Can you send a photo? I'd like to triage this with the contractor before their visit.",
            "I've read the report. This falls under my s.11 repair duty — I'll book a qualified contractor and update you by end of day.",
          ]
        : [
            "Thanks. Could you confirm by end of day when a contractor will visit? Happy to be flexible on timing.",
            "For context, I've attached a photo. I'll keep using the room carefully but this is affecting daily use.",
            "Understood. If it isn't resolved within 14 days I'll need to raise it with the council — hoping we don't need to go there.",
          ],
    };
  }

  if (/missed payment|late payment|rent arrears|missed rent|unpaid rent/i.test(context)) {
    return {
      summary: isLL
        ? "Rent payment is overdue. Handle this calmly and in writing — arrears processes have strict rules and a paper trail matters."
        : "Your rent payment is overdue. Communicate early — most landlords will work with you if you're upfront.",
      intent: isLL
        ? "Understand why the payment is late and agree a path forward."
        : "Explain the situation and propose a realistic plan.",
      legalOverview: isLL
        ? "Before any action: (1) send a polite written reminder with the amount, due date, and payment reference; (2) if unpaid after 14 days, send a formal arrears letter and offer a repayment plan; (3) a Section 8 notice on ground 8 needs at least 2 months' rent arrears at the date of service AND at the hearing — otherwise the claim can fail. Never threaten eviction in the first message — retaliatory or disproportionate action can be challenged."
        : "Get ahead of it. A short message explaining the situation (job loss, delay, admin error) and a concrete proposal (partial payment now, full by X date, or a repayment plan) puts you on the record as acting in good faith. This matters if things escalate. You can also ask about Universal Credit housing element or local council emergency support.",
      citation: "Housing Act 1988 s.8 (ground 8, 10, 11) · Pre-Action Protocol for Possession Claims",
      suggestedReplies: isLL
        ? [
            "Hi — I noticed this month's rent hasn't come through. Could you confirm when it'll be paid? Happy to discuss a short repayment plan if there's a hardship.",
            "Quick note: the rent for this month is showing as outstanding. Let me know if there's been a bank issue or if you need a few extra days.",
            "I'd like to understand what's happening so we can agree a plan. Can we have a brief call this week?",
          ]
        : [
            "I'm really sorry — cashflow has been tight this month. I can pay £X on Friday and the balance by the 20th. Would that work?",
            "Apologies for the delay — a bank transfer failed. I'm paying now and will send the confirmation screenshot.",
            "I wanted to flag this early: I'll be a week late this month because of [reason]. I'll send the full amount on [date].",
          ],
    };
  }

  if (/deposit/i.test(context)) {
    return {
      summary: isLL
        ? "Conversation about deposit deductions. Adjudicators apply 'fair wear and tear' and require itemised evidence."
        : "The landlord is discussing deposit deductions. You have the right to see itemised evidence and challenge amounts via the TDP scheme.",
      intent: isLL
        ? "Tenant wants clarity on what's being deducted and why."
        : "You want itemised deductions and proof — don't agree to vague amounts.",
      legalOverview: isLL
        ? "Deductions must be itemised, supported by the move-in inventory and dated photos, and proportionate. TDP adjudicators apply 'betterment' — you can't charge new-for-old. Cleaning is only deductible if the property is dirtier than at move-in. Gardening is rarely claimable."
        : "You're entitled to an itemised breakdown with evidence for every deduction. 'Fair wear and tear' is not deductible. If you disagree, raise a dispute through the TDP scheme (DPS, MyDeposits, or TDS) — the adjudicator reviews for free.",
      citation: "Housing Act 2004 · TDP scheme rules",
      suggestedReplies: isLL
        ? [
            "I'll share the move-in inventory and dated photos alongside the proposed deductions so we can review them together.",
            "I'd like to agree amounts amicably. I'll send each item with its receipt so you can see the basis.",
          ]
        : [
            "Thanks — could you send the itemised list with photos and receipts? Happy to review.",
            "I don't agree with all of these. Can we walk through each item before I consider raising a dispute?",
          ],
    };
  }

  if (/rent/i.test(context)) {
    return {
      summary: isLL
        ? "Discussion about rent. Mid-term increases need agreement or a Section 13 notice with at least 1 month's warning."
        : "The landlord is proposing a rent change. You have the right to question it — especially if it's above local market rates.",
      intent: isLL
        ? "Tenant wants to understand the change and timing."
        : "You want to understand the rationale and timing.",
      legalOverview: isLL
        ? "For an AST, increases mid-term need tenant agreement or a Section 13 notice (Form 4) with at least 1 month's notice. Limited to once a year. The increase must reflect local market rents or a First-tier Tribunal can strike it down."
        : "If you object, you can refer a Section 13 notice to the First-tier Tribunal within 1 month of receiving it. The tribunal sets the rent at the open market rate — which may be higher OR lower than proposed.",
      citation: "Housing Act 1988 s.13",
      suggestedReplies: isLL
        ? [
            "Happy to talk this through — I'll send a draft Section 13 notice for review and we can chat before anything is finalised.",
            "Here's my reasoning with comparable local listings. Open to discussion.",
          ]
        : [
            "Thanks for letting me know. Can you share the comparable listings you used so I can understand the figure?",
            "I'd like to discuss the timing and amount. Could we have a quick call?",
          ],
    };
  }

  if (/pre[- ]existing damage|move[- ]in/i.test(context)) {
    return {
      summary: isLL
        ? "Tenant has reported pre-existing damage. Log it against the inventory now to avoid end-of-tenancy disputes."
        : "You're reporting pre-existing damage. Timestamped photos + a written note protect your deposit.",
      intent: isLL
        ? "Confirm receipt and update the inventory record."
        : "Get this on the record before the inventory is signed off.",
      legalOverview: isLL
        ? "Pre-existing damage recorded at move-in cannot later be charged to the tenant. A countersigned inventory with photos is the strongest evidence at TDP adjudication."
        : "Anything not logged at move-in can be charged against your deposit at move-out. Get photos dated, filed in the Vault, and acknowledged by your landlord in writing.",
      suggestedReplies: isLL
        ? [
            "Thanks — I'll add these to the inventory record and countersign within 7 days.",
            "Noted. I'll attach your photos to the move-in inventory so they're part of the record.",
          ]
        : [
            "Attaching photos — please confirm these are logged against the inventory.",
            "Thanks. Could you countersign the updated inventory so we both have it on record?",
          ],
    };
  }

  return {
    summary: "General conversation. Keep written replies factual and dated for evidence.",
    intent: "Open question.",
    suggestedReplies: [
      isLL
        ? "Thanks for the message — I'll come back to you by tomorrow."
        : "Thanks — happy to discuss. Let me know the best time.",
    ],
  };
}
