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
    <div className="pnl-chart">
      <h4>7D PnL 对比</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" stroke="var(--text-secondary)" />
          <YAxis stroke="var(--text-secondary)" />
          <Tooltip />
          <Legend />
          <Bar dataKey="pnl" fill="var(--accent)" name="PnL %" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
