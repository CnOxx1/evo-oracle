import { useState, useEffect } from "react";

interface Protocol {
  name: string;
  type: string;
  base_apy: number;
  oracle_integrated: boolean;
  risk_adjusted_apy: number;
  safety_score: number;
  current_risk_exposure: number;
  rank: number;
}

interface ComparisonData {
  protocols: Protocol[];
  market_risk_score: number;
  safest_protocol: string;
  highest_yield: string;
}

export function ProtocolCompare() {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/protocol-comparison")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="glass-card p-8 text-center text-text-secondary animate-fade-in">加载中...</div>;
  if (!data) return <div className="glass-card p-8 text-center text-text-secondary">数据不可用</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold">
        协议<span className="gradient-text">安全</span>排名
      </h2>

      {/* Market context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center glow-border">
          <div className="text-2xl font-bold gradient-text">{data.market_risk_score}</div>
          <div className="text-text-secondary text-xs">当前市场风险分</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-lg font-bold text-risk-low">{data.safest_protocol}</div>
          <div className="text-text-secondary text-xs">最安全协议</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-lg font-bold text-accent">{data.highest_yield}</div>
          <div className="text-text-secondary text-xs">最高风险调整收益</div>
        </div>
      </div>

      {/* Protocol cards */}
      <div className="space-y-4">
        {data.protocols.map((p) => (
          <div key={p.name} className={`glass-card p-5 glow-border-hover transition-all ${p.rank === 1 ? "border border-risk-low/30" : ""}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-black ${p.rank === 1 ? "gradient-text" : "text-text-secondary"}`}>
                  #{p.rank}
                </span>
                <div>
                  <div className="font-bold text-lg">{p.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary text-xs px-2 py-0.5 rounded bg-bg-card">{p.type}</span>
                    {p.oracle_integrated && (
                      <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">Oracle 集成</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-risk-low">{p.safety_score.toFixed(0)}</div>
                <div className="text-text-secondary text-xs">安全评分</div>
              </div>
            </div>

            {/* Metrics bar */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <div className="text-text-secondary text-xs mb-1">基础 APY</div>
                <div className="font-bold">{p.base_apy}%</div>
              </div>
              <div>
                <div className="text-text-secondary text-xs mb-1">风险调整 APY</div>
                <div className={`font-bold ${p.risk_adjusted_apy >= p.base_apy * 0.7 ? "text-risk-low" : "text-risk-high"}`}>
                  {p.risk_adjusted_apy.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-text-secondary text-xs mb-1">风险敞口</div>
                <div className={`font-bold ${p.current_risk_exposure > 30 ? "text-risk-high" : "text-risk-low"}`}>
                  {p.current_risk_exposure.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Safety bar */}
            <div className="mt-3">
              <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-risk-low to-accent transition-all"
                  style={{ width: `${p.safety_score}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}