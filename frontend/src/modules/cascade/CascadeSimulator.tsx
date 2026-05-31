import { useState, useEffect } from "react";

interface Position {
  asset: string;
  size_usd: number;
  leverage: number;
  liquidation_price_drop: number;
}

interface TimelineRound {
  round: number;
  liquidated_count: number;
  sell_pressure_usd: number;
  cumulative_sell_pressure_usd: number;
  positions: Position[];
  price_impact_pct: number;
}

interface CascadeData {
  shock_asset: string;
  shock_pct: number;
  total_rounds: number;
  total_liquidated_positions: number;
  total_sell_pressure_usd: number;
  cascade_severity: string;
  timeline: TimelineRound[];
  surviving_positions: number;
}

export function CascadeSimulator() {
  const [asset, setAsset] = useState("BTC");
  const [shockPct, setShockPct] = useState(-30);
  const [data, setData] = useState<CascadeData | null>(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = () => {
    setLoading(true);
    fetch(`/api/cascade-simulator?asset=${asset}&shock_pct=${shockPct}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { runSimulation(); }, []);

  const severityColor = (s: string) =>
    s === "critical" ? "text-risk-critical" :
    s === "high" ? "text-risk-high" :
    s === "medium" ? "text-risk-medium" : "text-risk-low";

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold">
        清算<span className="gradient-text">瀑布</span>模拟器
      </h2>

      {/* Controls */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-text-secondary text-sm">冲击资产:</span>
          {["BTC", "ETH", "SUI"].map((a) => (
            <button
              key={a}
              onClick={() => setAsset(a)}
              className={`px-3 py-1 rounded text-sm cursor-pointer transition-all ${
                asset === a ? "bg-accent/20 text-text-primary font-semibold" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-secondary text-sm">跌幅:</span>
          <input
            type="range"
            min="-80"
            max="-5"
            value={shockPct}
            onChange={(e) => setShockPct(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-risk-critical font-mono font-bold">{shockPct}%</span>
        </div>
        <button
          onClick={runSimulation}
          className="gradient-btn px-4 py-1.5 rounded-lg text-sm cursor-pointer"
        >
          运行模拟
        </button>
      </div>

      {loading && <div className="glass-card p-8 text-center text-text-secondary">模拟中...</div>}
      {data && !loading && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 text-center">
              <div className={`text-2xl font-bold ${severityColor(data.cascade_severity)}`}>
                {data.cascade_severity.toUpperCase()}
              </div>
              <div className="text-text-secondary text-xs">级联严重度</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-risk-critical">{data.total_liquidated_positions}</div>
              <div className="text-text-secondary text-xs">清算仓位数</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold gradient-text">
                ${(data.total_sell_pressure_usd / 1_000_000).toFixed(1)}M
              </div>
              <div className="text-text-secondary text-xs">总卖压</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-risk-low">{data.surviving_positions}</div>
              <div className="text-text-secondary text-xs">存活仓位</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-card p-6 glow-border">
            <h3 className="font-bold mb-4">清算瀑布时间线</h3>
            <div className="space-y-4">
              {data.timeline.map((round) => (
                <div key={round.round} className="relative pl-8 pb-4 border-l-2 border-accent/30 last:border-l-0">
                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-accent/50 border-2 border-accent" />
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-accent font-mono text-sm">Round {round.round}</span>
                    <span className="text-risk-critical text-sm font-bold">
                      {round.liquidated_count} 仓位清算
                    </span>
                    <span className="text-text-secondary text-xs">
                      卖压 ${(round.sell_pressure_usd / 1_000_000).toFixed(2)}M
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-bg-secondary rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-risk-critical transition-all"
                      style={{ width: `${Math.min(100, (round.cumulative_sell_pressure_usd / data.total_sell_pressure_usd) * 100)}%` }}
                    />
                  </div>
                  {/* Positions */}
                  <div className="flex flex-wrap gap-2">
                    {round.positions.slice(0, 5).map((pos, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded bg-bg-card border border-border/50">
                        {pos.asset} {pos.leverage}x · ${(pos.size_usd / 1000).toFixed(0)}K
                      </span>
                    ))}
                    {round.positions.length > 5 && (
                      <span className="text-xs px-2 py-1 text-text-secondary">
                        +{round.positions.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Impact visualization */}
          <div className="glass-card p-6">
            <h3 className="font-bold mb-4">价格冲击传导</h3>
            <div className="grid grid-cols-3 gap-4">
              {["BTC", "ETH", "SUI"].map((a) => {
                const isShock = a === data.shock_asset;
                const impact = isShock ? data.shock_pct : data.shock_pct * 0.6;
                return (
                  <div key={a} className={`p-4 rounded-lg text-center ${isShock ? "bg-risk-critical/10 border border-risk-critical/30" : "bg-bg-card"}`}>
                    <div className="font-bold mb-1">{a}</div>
                    <div className={`text-xl font-mono ${isShock ? "text-risk-critical" : "text-risk-high"}`}>
                      {impact.toFixed(1)}%
                    </div>
                    {isShock && <div className="text-xs text-risk-critical mt-1">冲击源</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
