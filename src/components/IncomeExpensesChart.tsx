import {
  Bar, BarChart, CartesianGrid, Line, ComposedChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { MONTHLY_FINANCE } from "@/data/financialData";

const fmt = (v: number) => `£${(v / 1000).toFixed(1)}k`;

export function IncomeExpensesChart() {
  const data = MONTHLY_FINANCE.map((d) => ({ ...d, net: d.income - d.expenses }));
  const totalIn = data.reduce((s, d) => s + d.income, 0);
  const totalOut = data.reduce((s, d) => s + d.expenses, 0);
  const net = totalIn - totalOut;

  return (
    <div>
      <div className="flex items-end justify-between mb-3 gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <Legend swatch="bg-success" label="Income" value={`£${totalIn.toLocaleString()}`} />
          <Legend swatch="bg-danger" label="Expenses" value={`£${totalOut.toLocaleString()}`} />
          <Legend swatch="bg-primary" label="Net" value={`£${net.toLocaleString()}`} />
        </div>
        <span className="text-[10px] text-muted-foreground">Last 6 months</span>
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={fmt}
              width={48}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--secondary))", opacity: 0.4 }}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 11,
                padding: "6px 10px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              formatter={(v: number, name: string) => [`£${v.toLocaleString()}`, name]}
            />
            <Bar dataKey="income" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} maxBarSize={20} />
            <Bar dataKey="expenses" fill="hsl(var(--danger))" radius={[3, 3, 0, 0]} maxBarSize={20} />
            <Line
              type="monotone"
              dataKey="net"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "hsl(var(--primary))" }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ swatch, label, value }: { swatch: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-sm ${swatch}`} />
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-xs font-bold text-foreground tabular-nums">{value}</span>
    </div>
  );
}
