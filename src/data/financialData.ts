// Demo monthly income vs landlord spend (last 6 months) — portfolio-wide
export interface MonthlyFinance {
  month: string; // short label e.g. "Oct"
  income: number;
  expenses: number;
}

export const MONTHLY_FINANCE: MonthlyFinance[] = [
  { month: "Nov", income: 5120, expenses: 320 },
  { month: "Dec", income: 5120, expenses: 1140 },
  { month: "Jan", income: 5120, expenses: 480 },
  { month: "Feb", income: 5120, expenses: 220 },
  { month: "Mar", income: 5120, expenses: 890 },
  { month: "Apr", income: 5120, expenses: 410 },
];
