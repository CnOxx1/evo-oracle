import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { BacktestPoint } from "../../api/client";

interface LunaTimelineChartProps {
  series: BacktestPoint[];
}

export function LunaTimelineChart({ series }: LunaTimelineChartProps) {
  // 找到有事件的日期用于标注
  const eventDates = series.filter((p) => p.event).map((p) => p.date);

  return (
    <div className="luna-chart">
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={series}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
          <YAxis yAxisId="pnl" stroke="var(--text-secondary)" fontSize={12}
            label={{ value: "PnL %", angle: -90, position: "insideLeft", fill: "var(--text-secondary)" }} />
          <YAxis yAxisId="exposure" orientation="right" stroke="var(--text-secondary)"
            fontSize={12} domain={[0, 100]}
            label={{ value: "仓位 %", angle: 90, position: "insideRight", fill: "var(--text-secondary)" }} />
          <Tooltip
            contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6 }}
            labelStyle={{ color: "var(--text-primary)" }}
            formatter={(value: number, name: string) => {
              if (name === "仓位") return [`${value}%`, name];
              return [`${value.toFixed(1)}%`, name];
            }}
          />
          <Legend />

          {/* 事件标注线 */}
          {eventDates.map((date) => (
            <ReferenceLine key={date} x={date} yAxisId="pnl"
              stroke="var(--severity-warning)" strokeDasharray="3 3" strokeOpacity={0.5} />
          ))}

          {/* 仓位面积 */}
          <Area yAxisId="exposure" type="stepAfter" dataKey="exposure"
            fill="var(--accent)" fillOpacity={0.1} stroke="var(--accent)"
            strokeOpacity={0.4} name="仓位" />

          {/* PnL 曲线 */}
          <Line yAxisId="pnl" type="monotone" dataKey="protected_pnl"
            stroke="var(--risk-low)" strokeWidth={2.5} name="Protected PnL%"
            dot={false} />
          <Line yAxisId="pnl" type="monotone" dataKey="static_pnl"
            stroke="var(--risk-critical)" strokeWidth={2} name="Static PnL%"
            dot={false} strokeDasharray="4 2" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
