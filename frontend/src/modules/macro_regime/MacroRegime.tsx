import { useState, useEffect } from "react";

interface RegimeHistory {
  stance: string;
  start_ts: number;
  duration_days: number;
}

interface MacroData {
  current_stance: string;
  stance_duration_days: number;
  indicators: Record<string, any>;
  regime_history: RegimeHistory[];
  current_behavior: {
    typical_btc: string;
    typical_alts: string;
    typical_stables: string;
    description: string;
  };
  portfolio_var_95: number;
  recommendation: string;
}

export function MacroRegime() {
  const [data, setData] = useState<MacroData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/macro/detail")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="glass-card p-8 text-center text-text-secondary animate-fade-in">加载中...</div>;
  if (!data) return <div className="glass-card p-8 text-center text-text-secondary">数据不可用</div>;

  const stanceColor = (s: string) =>
    s === "risk_off" ? "text-risk-critical" :
    s === "risk_on" ? "text-risk-low" : "text-accent";

  const stanceBg = (s: string) =>
    s === "risk_off" ? "bg-risk-critical/20" :
    s === "risk_on" ? "bg-risk-low/20" : "bg-accent/20";

  const stanceLabel = (s: string) =>
    s === "risk_off" ? "避险" : s === "risk_on" ? "冒险" : "中性";

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold">
        宏观<span className="gradient-text">状态</span>指示器
      </h2>

      {/* Current stance */}
      <div className="glass-card p-8 text-center glow-border">
        <div className="text-text-secondary text-sm mb-2">当前市场状态</div>
        <div className={`text-5xl font-black mb-2 ${stanceColor(data.current_stance)}`}>
          {stanceLabel(data.current_stance)}
        </div>
        <div className="text-text-secondary">{data.current_behavior.description}</div>
        <div className="text-text-secondary text-sm mt-2">
          已持续 <span className="text-text-primary font-bold">{data.stance_duration_days}</span> 天
        </div>
      </div>

      {/* Typical behavior */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 text-center">
          <div className="text-text-secondary text-xs mb-2">BTC 典型表现</div>
          <div className="text-xl font-bold">{data.current_behavior.typical_btc}</div>
        </div>
        <div className="glass-card p-5 text-center">
          <div className="text-text-secondary text-xs mb-2">山寨币典型表现</div>
          <div className="text-xl font-bold">{data.current_behavior.typical_alts}</div>
        </div>
        <div className="glass-card p-5 text-center">
          <div className="text-text-secondary text-xs mb-2">稳定币表现</div>
          <div className="text-xl font-bold">{data.current_behavior.typical_stables}</div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="glass-card p-6 border border-accent/30">
        <h3 className="font-bold mb-2">操作建议</h3>
        <p className="text-text-secondary">{data.recommendation}</p>
        <div className="mt-3 text-sm text-text-secondary">
          Portfolio VaR (95%): <span className="text-text-primary font-bold">{data.portfolio_var_95}%</span>
        </div>
      </div>

      {/* Regime history */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4">状态切换历史</h3>
        <div className="flex items-center gap-1 h-12">
          {data.regime_history.map((r, i) => (
            <div
              key={i}
              className={`h-full rounded flex items-center justify-center text-xs font-bold ${stanceBg(r.stance)} ${stanceColor(r.stance)}`}
              style={{ flex: r.duration_days }}
              title={`${stanceLabel(r.stance)} - ${r.duration_days}天`}
            >
              {r.duration_days > 3 && `${stanceLabel(r.stance)} ${r.duration_days}d`}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-text-secondary">
          <span>30天前</span>
          <span>现在</span>
        </div>
      </div>
    </div>
  );
}
