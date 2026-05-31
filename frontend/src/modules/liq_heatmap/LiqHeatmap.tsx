import { useState, useEffect } from "react";

interface HeatmapCell {
  exchange: string;
  leverage_tier: string;
  density: number;
  volume_usd: number;
  at_risk_pct: number;
  position_count: number;
}

interface ExchangeSummary {
  exchange: string;
  total_volume_usd: number;
  avg_risk_density: number;
  high_leverage_pct: number;
}

interface HeatmapData {
  heatmap: HeatmapCell[];
  exchanges: ExchangeSummary[];
  leverage_tiers: string[];
  total_at_risk_usd: number;
  highest_risk_zone: HeatmapCell;
  concentration_warning: boolean;
}

export function LiqHeatmap() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/liquidation-heatmap")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="glass-card p-8 text-center text-text-secondary animate-fade-in">加载中...</div>;
  if (!data) return <div className="glass-card p-8 text-center text-text-secondary">数据不可用</div>;

  const densityColor = (d: number) => {
    if (d > 0.7) return "bg-risk-critical";
    if (d > 0.4) return "bg-risk-high";
    if (d > 0.2) return "bg-risk-medium";
    return "bg-risk-low/50";
  };

  const exchanges = [...new Set(data.heatmap.map((h) => h.exchange))];

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold">
        清算<span className="gradient-text">热力图</span>
      </h2>

      {/* Warning banner */}
      {data.concentration_warning && (
        <div className="glass-card p-4 border border-risk-critical/30 bg-risk-critical/5 text-center">
          <span className="text-risk-critical font-bold">⚠️ 高集中度预警</span>
          <span className="text-text-secondary text-sm ml-2">
            清算风险集中度过高，总风险敞口 ${(data.total_at_risk_usd / 1_000_000).toFixed(0)}M
          </span>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold gradient-text">${(data.total_at_risk_usd / 1_000_000).toFixed(0)}M</div>
          <div className="text-text-secondary text-xs">总风险敞口</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-risk-critical">
            {data.highest_risk_zone.exchange}
          </div>
          <div className="text-text-secondary text-xs">最高风险区域</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-risk-high">
            {data.highest_risk_zone.leverage_tier}
          </div>
          <div className="text-text-secondary text-xs">最危险杠杆</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-accent">{exchanges.length}</div>
          <div className="text-text-secondary text-xs">追踪交易所</div>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="glass-card p-6 glow-border overflow-x-auto">
        <h3 className="font-bold mb-4">交易所 × 杠杆倍数 清算密度</h3>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-text-secondary text-sm p-2">交易所</th>
              {data.leverage_tiers.map((t) => (
                <th key={t} className="text-center text-text-secondary text-sm p-2">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exchanges.map((ex) => (
              <tr key={ex}>
                <td className="p-2 font-bold text-sm">{ex}</td>
                {data.leverage_tiers.map((tier) => {
                  const cell = data.heatmap.find((h) => h.exchange === ex && h.leverage_tier === tier);
                  return (
                    <td key={tier} className="p-1">
                      <div
                        className={`rounded p-2 text-center text-xs transition-all hover:scale-105 ${densityColor(cell?.density ?? 0)}`}
                        style={{ opacity: 0.4 + (cell?.density ?? 0) * 0.6 }}
                        title={`${ex} ${tier}: ${cell?.position_count ?? 0} positions, $${((cell?.volume_usd ?? 0) / 1_000_000).toFixed(1)}M`}
                      >
                        {cell ? `${(cell.density * 100).toFixed(0)}%` : "-"}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-text-secondary">
          <span>密度:</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-risk-low/50" /> 低</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-risk-medium" /> 中</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-risk-high" /> 高</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-risk-critical" /> 极高</span>
        </div>
      </div>

      {/* Exchange summary */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4">交易所风险概况</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.exchanges.map((ex) => (
            <div key={ex.exchange} className="flex items-center justify-between p-3 rounded-lg bg-bg-card/50">
              <div>
                <div className="font-bold">{ex.exchange}</div>
                <div className="text-text-secondary text-xs">
                  高杠杆占比 {ex.high_leverage_pct}%
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">${(ex.total_volume_usd / 1_000_000).toFixed(0)}M</div>
                <div className="text-text-secondary text-xs">
                  风险密度 {(ex.avg_risk_density * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
