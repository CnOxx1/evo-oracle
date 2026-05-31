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

const PRESETS: { label: string; desc: string; asset: string; pct: number }[] = [
  { label: "LUNA 崩盘", desc: "2022.05 UST 脱锚级联", asset: "BTC", pct: -35 },
  { label: "FTX 暴雷", desc: "2022.11 交易所挤兑", asset: "SOL", pct: -45 },
  { label: "SVB 危机", desc: "2023.03 银行业恐慌", asset: "BTC", pct: -15 },
  { label: "519 暴跌", desc: "2021.05 中国禁令", asset: "BTC", pct: -30 },
];

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
      case "critical": return "var(--color-risk-critical)";
      case "high": return "var(--color-risk-high)";
      case "medium": return "var(--color-risk-medium)";
      default: return "var(--color-risk-low)";
    }
  };

  return (
    <section className="animate-fade-in max-w-[900px]">
      <h2 className="text-xl font-bold mb-4 gradient-text">压力测试模拟器</h2>

      <div className="flex gap-2 items-center mb-4 flex-wrap">
        <span className="text-xs text-text-secondary mr-2">历史场景一键模拟:</span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer border transition-all ${
              shockAsset === p.asset && shockPct === p.pct
                ? "gradient-btn"
                : "bg-bg-secondary border-border text-text-secondary hover:border-accent hover:text-text-primary"
            }`}
            onClick={() => { setShockAsset(p.asset); setShockPct(p.pct); }}
            title={p.desc}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="glass-card p-5 mb-6 flex gap-6 items-end flex-wrap">
        <label className="flex flex-col gap-1.5 text-sm text-text-secondary">
          冲击资产
          <select
            className="bg-bg-secondary border border-border rounded-lg px-3 py-2 text-text-primary"
            value={shockAsset}
            onChange={(e) => setShockAsset(e.target.value)}
          >
            {ASSETS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-text-secondary">
          冲击幅度: {shockPct}%
          <input
            type="range"
            className="w-[200px] accent-accent cursor-pointer"
            min={-50}
            max={-5}
            step={1}
            value={shockPct}
            onChange={(e) => setShockPct(Number(e.target.value))}
          />
        </label>
      </div>

      {isLoading && <div className="text-center py-8 text-text-secondary animate-pulse">模拟计算中...</div>}
      {error && <div className="text-center py-8 text-risk-high">压力测试服务不可用</div>}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="glass-card p-4 glow-border-hover">
              <span className="block text-xs text-text-secondary mb-1">组合预期损失</span>
              <span className="text-2xl font-bold text-risk-high">
                {data.total_portfolio_loss_pct.toFixed(2)}%
              </span>
            </div>
            <div className="glass-card p-4 glow-border-hover">
              <span className="block text-xs text-text-secondary mb-1">级联清算风险</span>
              <span className="text-2xl font-bold" style={{ color: riskColor(data.cascade_risk_level) }}>
                {data.cascade_risk_level.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm text-text-secondary font-semibold mb-3">各资产预期损失</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.asset_losses} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <XAxis dataKey="symbol" stroke="var(--color-text-secondary)" />
                <YAxis stroke="var(--color-text-secondary)" tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, "预期损失"]}
                />
                <Bar dataKey="expected_loss_pct" radius={[4, 4, 0, 0]}>
                  {data.asset_losses.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        Math.abs(entry.expected_loss_pct) > 15
                          ? "var(--color-risk-high)"
                          : Math.abs(entry.expected_loss_pct) > 8
                          ? "var(--color-risk-medium)"
                          : "var(--color-risk-low)"
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
