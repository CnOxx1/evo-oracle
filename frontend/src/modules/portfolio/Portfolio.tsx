import { useState, useEffect } from "react";

interface Holding {
  asset: string;
  current_value_usd: number;
  current_weight_pct: number;
  risk_score: number;
  risk_level: string;
  recommended_weight_pct: number;
  drift_pct: number;
  action: string;
}

interface PortfolioData {
  total_value_usd: number;
  portfolio_risk_score: number;
  portfolio_risk_level: string;
  holdings: Holding[];
  rebalance_needed: boolean;
  potential_risk_reduction: number;
}

export function Portfolio() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portfolio")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="glass-card p-8 text-center text-text-secondary animate-fade-in">加载中...</div>;
  if (!data) return <div className="glass-card p-8 text-center text-text-secondary">数据不可用</div>;

  const riskColor = (level: string) =>
    level === "critical" ? "text-risk-critical" :
    level === "high" ? "text-risk-high" :
    level === "medium" ? "text-risk-medium" : "text-risk-low";

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold">
        Portfolio <span className="gradient-text">追踪</span>
      </h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center glow-border">
          <div className="text-2xl font-bold gradient-text">${(data.total_value_usd / 1000).toFixed(1)}K</div>
          <div className="text-text-secondary text-xs">总价值</div>
        </div>
        <div className="glass-card p-4 text-center glow-border">
          <div className={`text-2xl font-bold ${riskColor(data.portfolio_risk_level)}`}>
            {Math.round(data.portfolio_risk_score)}
          </div>
          <div className="text-text-secondary text-xs">组合风险分</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className={`text-2xl font-bold ${data.rebalance_needed ? "text-risk-high" : "text-risk-low"}`}>
            {data.rebalance_needed ? "需要" : "正常"}
          </div>
          <div className="text-text-secondary text-xs">调仓建议</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-risk-low">-{data.potential_risk_reduction}</div>
          <div className="text-text-secondary text-xs">可降低风险分</div>
        </div>
      </div>

      {/* Holdings */}
      <div className="glass-card p-6 glow-border">
        <h3 className="font-bold mb-4">持仓明细</h3>
        <div className="space-y-4">
          {data.holdings.map((h) => (
            <div key={h.asset} className="flex items-center gap-4 p-3 rounded-lg bg-bg-card/50">
              <div className="w-16 font-bold text-lg">{h.asset}</div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-text-secondary text-sm">当前 {h.current_weight_pct}%</span>
                  <span className="text-text-secondary text-sm">建议 {h.recommended_weight_pct}%</span>
                </div>
                {/* Weight bar */}
                <div className="h-3 bg-bg-secondary rounded-full overflow-hidden relative">
                  <div
                    className="absolute h-full bg-accent/30 rounded-full"
                    style={{ width: `${h.recommended_weight_pct}%` }}
                  />
                  <div
                    className="absolute h-full bg-accent rounded-full"
                    style={{ width: `${h.current_weight_pct}%` }}
                  />
                </div>
              </div>
              <div className="text-right w-20">
                <div className={`font-bold ${riskColor(h.risk_level)}`}>{h.risk_score}</div>
                <div className="text-xs text-text-secondary">风险分</div>
              </div>
              <div className="w-20 text-right">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  h.action === "reduce" ? "bg-risk-high/20 text-risk-high" :
                  h.action === "increase" ? "bg-risk-low/20 text-risk-low" :
                  "bg-accent/20 text-accent"
                }`}>
                  {h.action === "reduce" ? "减仓" : h.action === "increase" ? "加仓" : "持有"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Drift visualization */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4">权重偏离度</h3>
        <div className="space-y-3">
          {data.holdings.map((h) => (
            <div key={h.asset} className="flex items-center gap-3">
              <span className="w-12 text-sm font-bold">{h.asset}</span>
              <div className="flex-1 h-6 relative flex items-center">
                <div className="absolute left-1/2 w-px h-full bg-border/50" />
                <div
                  className={`absolute h-4 rounded ${h.drift_pct > 0 ? "bg-risk-high/50 left-1/2" : "bg-risk-low/50 right-1/2"}`}
                  style={{
                    width: `${Math.min(50, Math.abs(h.drift_pct))}%`,
                    ...(h.drift_pct < 0 ? { right: "50%" } : { left: "50%" }),
                  }}
                />
              </div>
              <span className={`w-16 text-right text-sm font-mono ${h.drift_pct > 5 ? "text-risk-high" : h.drift_pct < -5 ? "text-risk-low" : "text-text-secondary"}`}>
                {h.drift_pct > 0 ? "+" : ""}{h.drift_pct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
