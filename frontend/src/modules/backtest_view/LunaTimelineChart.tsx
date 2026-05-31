import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { BacktestPoint } from "../../api/client";

interface LunaTimelineChartProps {
  series: BacktestPoint[];
}

export function LunaTimelineChart({ series }: LunaTimelineChartProps) {
  const eventDates = series.filter((p) => p.event).map((p) => p.date);

  return (
    <div className="glass-card p-4 mb-6">
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={series}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={12} />
          <YAxis yAxisId="pnl" stroke="var(--color-text-secondary)" fontSize={12}
            label={{ value: "PnL %", angle: -90, position: "insideLeft", fill: "var(--color-text-secondary)" }} />
          <YAxis yAxisId="exposure" orientation="right" stroke="var(--color-text-secondary)"
            fontSize={12} domain={[0, 100]}
            label={{ value: "仓位 %", angle: 90, position: "insideRight", fill: "var(--color-text-secondary)" }} />
          <Tooltip
            contentStyle={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
            labelStyle={{ color: "var(--color-text-primary)" }}
            formatter={(value: number, name: string) => {
              if (name === "仓位") return [`${value}%`, name];
              return [`${value.toFixed(1)}%`, name];
            }}
          />
          <Legend />
          {eventDates.map((date) => (
            <ReferenceLine key={date} x={date} yAxisId="pnl"
              stroke="var(--color-severity-warning)" strokeDasharray="3 3" strokeOpacity={0.5} />
          ))}
          <Area yAxisId="exposure" type="stepAfter" dataKey="exposure"
            fill="var(--color-accent)" fillOpacity={0.1} stroke="var(--color-accent)"
            strokeOpacity={0.4} name="仓位" />
          <Line yAxisId="pnl" type="monotone" dataKey="protected_pnl"
            stroke="var(--color-risk-low)" strokeWidth={2.5} name="Protected PnL%"
            dot={false} />
          <Line yAxisId="pnl" type="monotone" dataKey="static_pnl"
            stroke="var(--color-risk-critical)" strokeWidth={2} name="Static PnL%"
            dot={false} strokeDasharray="4 2" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
