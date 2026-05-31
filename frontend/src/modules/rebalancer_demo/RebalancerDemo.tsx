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
    <section className="rebalancer-demo">
      <h2 className="rebalancer-demo__title">实时调仓演示</h2>

      <div className="rebalancer-demo__controls">
        {SCENARIOS.map((s) => (
          <button
            key={s.value}
            className={`rebalancer-demo__btn ${scenario === s.value ? "rebalancer-demo__btn--active" : ""}`}
            onClick={() => setScenario(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="loading">加载调仓数据...</div>}
      {error && <div className="error">调仓演示服务不可用</div>}

      {data && (
        <>
          <div className="rebalancer-demo__chart">
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={data.series} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="timestamp"
                  stroke="var(--text-secondary)"
                  tickFormatter={(t: string) => t.slice(11, 16)}
                />
                <YAxis
                  yAxisId="left"
                  stroke="var(--accent)"
                  tickFormatter={(v: number) => `${v}%`}
                  domain={[0, 100]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="var(--risk-high)"
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="sui_position_pct"
                  name="SUI 仓位%"
                  fill="var(--accent)"
                  fillOpacity={0.2}
                  stroke="var(--accent)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="risk_score"
                  name="风险评分"
                  stroke="var(--risk-high)"
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
                    fill="var(--accent)"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="rebalancer-demo__summary">
            <span>总调仓次数: {data.summary.total_rebalances}</span>
            <span>最高风险: {data.summary.max_risk_reached}</span>
            <span>最终仓位: {data.summary.final_position_pct}%</span>
          </div>

          <div className="rebalancer-demo__actions">
            <h3>调仓动作列表</h3>
            <ul className="rebalancer-demo__action-list">
              {data.actions.map((action, idx) => (
                <li key={idx} className="rebalancer-demo__action-item">
                  <span className="rebalancer-demo__action-time">
                    {action.timestamp.slice(11, 16)}
                  </span>
                  <span className="rebalancer-demo__action-desc">
                    {action.action} ({action.from_pct}% → {action.to_pct}%)
                  </span>
                  <span className="rebalancer-demo__action-reason">
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
