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
  suggestedReplies: string[];
}

export function mediatorBriefFor(context: string): MediatorBrief {
  if (/repair/i.test(context)) {
    return {
      summary:
        "Your tenant has reported a maintenance issue. The 14-day reasonable repair window starts today.",
      intent: "Wants acknowledgement and a timeline.",
      suggestedReplies: [
        "Thanks for letting me know — I'll arrange a contractor visit this week and will confirm a time within 24 hours.",
        "Can you send a photo? I'd like to triage this with the contractor before their visit.",
      ],
    };
  }
  if (/deposit/i.test(context)) {
    return {
      summary:
        "Conversation about deposit deductions. Adjudicators apply 'fair wear and tear' and require itemised evidence.",
      intent: "Wants clarity on what's being deducted and why.",
      suggestedReplies: [
        "I'll share the move-in inventory and dated photos alongside the proposed deductions so we can review them together.",
      ],
    };
  }
  if (/rent/i.test(context)) {
    return {
      summary:
        "Discussion about rent. Mid-term increases need agreement or a Section 13 notice with at least 1 month's warning.",
      intent: "Wants to understand the change and timing.",
      suggestedReplies: [
        "Happy to talk this through — I'll send a draft Section 13 notice for review and we can chat before anything is finalised.",
      ],
    };
  }
  return {
    summary: "General conversation. Keep written replies factual and dated for evidence.",
    intent: "Open question.",
    suggestedReplies: ["Thanks for the message — I'll come back to you by tomorrow."],
  };
}
