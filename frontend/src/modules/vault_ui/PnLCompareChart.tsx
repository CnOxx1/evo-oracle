import { VaultState } from "../../api/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface PnLCompareChartProps {
  vault: VaultState;
}

export function PnLCompareChart({ vault }: PnLCompareChartProps) {
  const data = [
    { name: "Protected", pnl: vault.protected.pnl_7d ?? 0 },
    { name: "Static 50/50", pnl: vault.static.pnl_7d ?? 0 },
  ];

  return (
    <div className="bg-bg-card/50 backdrop-blur-md border border-accent/10 rounded-xl p-4 mb-6">
      <h4 className="text-sm text-text-secondary font-semibold mb-3">7D PnL 对比</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="name" stroke="var(--color-text-secondary)" />
          <YAxis stroke="var(--color-text-secondary)" />
          <Tooltip contentStyle={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }} />
          <Legend />
          <Bar dataKey="pnl" fill="var(--color-accent)" name="PnL %" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
