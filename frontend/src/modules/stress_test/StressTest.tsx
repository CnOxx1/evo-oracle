import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface AssetLoss {
  symbol: string;
  expected_loss_pct: number;
  current_exposure: number;
}

interface StressTestResponse {
  shock_asset: string;
  shock_pct: number;
  total_portfolio_loss_pct: number;
  cascade_risk_level: string;
  asset_losses: AssetLoss[];
}

const ASSETS = ["BTC", "ETH", "SUI", "SOL", "ARB", "DOGE"];

export function StressTest() {
  const [shockAsset, setShockAsset] = useState("BTC");
  const [shockPct, setShockPct] = useState(-20);

  const { data, isLoading, error } = useQuery<StressTestResponse>({
    queryKey: ["stress-test", shockAsset, shockPct],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || ""}/api/stress-test?asset=${shockAsset}&shock_pct=${shockPct}`
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
  });

  const riskColor = (level: string) => {
    switch (level) {
      case "critical": return "var(--risk-critical)";
      case "high": return "var(--risk-high)";
      case "medium": return "var(--risk-medium)";
      default: return "var(--risk-low)";
    }
  };

  return (
    <section className="stress-test">
      <h2 className="stress-test__title">压力测试模拟器</h2>

      <div className="stress-test__controls">
        <label className="stress-test__label">
          冲击资产
          <select
            className="stress-test__select"
            value={shockAsset}
            onChange={(e) => setShockAsset(e.target.value)}
          >
            {ASSETS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>

        <label className="stress-test__label">
          冲击幅度: {shockPct}%
          <input
            type="range"
            className="stress-test__slider"
            min={-50}
            max={-5}
            step={1}
            value={shockPct}
            onChange={(e) => setShockPct(Number(e.target.value))}
          />
        </label>
      </div>

      {isLoading && <div className="loading">模拟计算中...</div>}
      {error && <div className="error">压力测试服务不可用</div>}

      {data && (
        <>
          <div className="stress-test__summary">
            <div className="stress-test__metric">
              <span className="stress-test__metric-label">组合预期损失</span>
              <span className="stress-test__metric-value" style={{ color: "var(--risk-high)" }}>
                {data.total_portfolio_loss_pct.toFixed(2)}%
              </span>
            </div>
            <div className="stress-test__metric">
              <span className="stress-test__metric-label">级联清算风险</span>
              <span
                className="stress-test__metric-value"
                style={{ color: riskColor(data.cascade_risk_level) }}
              >
                {data.cascade_risk_level.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="stress-test__chart">
            <h3>各资产预期损失</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.asset_losses} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <XAxis dataKey="symbol" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, "预期损失"]}
                />
                <Bar dataKey="expected_loss_pct" radius={[4, 4, 0, 0]}>
                  {data.asset_losses.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        Math.abs(entry.expected_loss_pct) > 15
                          ? "var(--risk-high)"
                          : Math.abs(entry.expected_loss_pct) > 8
                          ? "var(--risk-medium)"
                          : "var(--risk-low)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
