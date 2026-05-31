import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  CartesianGrid,
} from "recharts";

interface TimePoint {
  timestamp: string;
  sui_position_pct: number;
  risk_score: number;
  is_rebalance: boolean;
}

interface RebalanceAction {
  timestamp: string;
  action: string;
  reason: string;
  from_pct: number;
  to_pct: number;
}

interface RebalancerDemoResponse {
  scenario: string;
  series: TimePoint[];
  actions: RebalanceAction[];
  summary: {
    total_rebalances: number;
    max_risk_reached: number;
    final_position_pct: number;
  };
}

type Scenario = "normal" | "stress" | "crash";

const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: "normal", label: "正常行情" },
  { value: "stress", label: "压力行情" },
  { value: "crash", label: "崩盘行情" },
];

export function RebalancerDemo() {
  const [scenario, setScenario] = useState<Scenario>("stress");

  const { data, isLoading, error } = useQuery<RebalancerDemoResponse>({
    queryKey: ["rebalancer-demo", scenario],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || ""}/api/rebalancer-demo?scenario=${scenario}`
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
  });

  const rebalancePoints = (data?.series ?? []).filter((p) => p.is_rebalance);

  return (
    <section className="animate-fade-in max-w-[900px]">
      <h2 className="text-xl font-bold mb-4 gradient-text">实时调仓演示</h2>

      <div className="flex gap-3 mb-6">
        {SCENARIOS.map((s) => (
          <button
            key={s.value}
            className={`px-4 py-2 rounded-lg text-sm cursor-pointer border transition-all ${
              scenario === s.value
                ? "gradient-btn"
                : "bg-bg-card border-border text-text-secondary hover:border-accent hover:text-text-primary"
            }`}
            onClick={() => setScenario(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-center py-8 text-text-secondary animate-pulse">加载调仓数据...</div>}
      {error && <div className="text-center py-8 text-risk-high">调仓演示服务不可用</div>}

      {data && (
        <>
          <div className="glass-card p-5 mb-6">
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={data.series} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="timestamp"
                  stroke="var(--color-text-secondary)"
                  tickFormatter={(t: string) => t.slice(11, 16)}
                />
                <YAxis
                  yAxisId="left"
                  stroke="var(--color-accent)"
                  tickFormatter={(v: number) => `${v}%`}
                  domain={[0, 100]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="var(--color-risk-high)"
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="sui_position_pct"
                  name="SUI 仓位%"
                  fill="var(--color-accent)"
                  fillOpacity={0.2}
                  stroke="var(--color-accent)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="risk_score"
                  name="风险评分"
                  stroke="var(--color-risk-high)"
                  dot={false}
                  strokeWidth={2}
                />
                {rebalancePoints.map((point, idx) => (
                  <ReferenceDot
                    key={idx}
                    x={point.timestamp}
                    y={point.sui_position_pct}
                    yAxisId="left"
                    r={5}
                    fill="var(--color-accent)"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-4 mb-6 flex gap-6 text-sm text-text-secondary">
            <span>总调仓次数: {data.summary.total_rebalances}</span>
            <span>最高风险: {data.summary.max_risk_reached}</span>
            <span>最终仓位: {data.summary.final_position_pct}%</span>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm text-text-secondary font-semibold mb-3">调仓动作列表</h3>
            <ul className="list-none p-0 max-h-[200px] overflow-y-auto">
              {data.actions.map((action, idx) => (
                <li key={idx} className="flex gap-3 items-center py-1.5 border-b border-border text-xs">
                  <span className="text-text-secondary min-w-[40px]">
                    {action.timestamp.slice(11, 16)}
                  </span>
                  <span className="font-semibold">
                    {action.action} ({action.from_pct}% → {action.to_pct}%)
                  </span>
                  <span className="text-text-secondary ml-auto">
                    {action.reason}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}