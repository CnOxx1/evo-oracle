import { useState, useEffect } from "react";

interface AttributionFactor {
  factor: string;
  contribution_pct: number;
  description: string;
}

interface RebalanceEvent {
  day: number;
  action: string;
  risk_score_at_time: number;
  saved_loss_pct: number;
}

interface AttributionData {
  period_days: number;
  protected_return_pct: number;
  static_return_pct: number;
  outperformance_pct: number;
  attribution: AttributionFactor[];
  rebalance_events: RebalanceEvent[];
  total_rebalances: number;
  total_saved_loss_pct: number;
  current_risk_score: number;
}

export function VaultAttribution() {
  const [data, setData] = useState<AttributionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vault/attribution")
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
        Vault <span className="gradient-text">收益归因</span>
      </h2>

      {/* Performance comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 text-center glow-border border-risk-low/30">
          <div className="text-text-secondary text-sm mb-1">Protected Vault</div>
          <div className={`text-4xl font-black ${data.protected_return_pct >= 0 ? "text-risk-low" : "text-risk-medium"}`}>
            {data.protected_return_pct > 0 ? "+" : ""}{data.protected_return_pct}%
          </div>
          <div className="text-text-secondary text-xs mt-1">{data.period_days} 天收益</div>
        </div>
        <div className="glass-card p-6 text-center border border-risk-critical/30">
          <div className="text-text-secondary text-sm mb-1">Static Vault</div>
          <div className="text-4xl font-black text-risk-critical">
            {data.static_return_pct}%
          </div>
          <div className="text-text-secondary text-xs mt-1">{data.period_days} 天收益</div>
        </div>
        <div className="glass-card p-6 text-center glow-border">
          <div className="text-text-secondary text-sm mb-1">超额收益</div>
          <div className="text-4xl font-black gradient-text">
            +{data.outperformance_pct}%
          </div>
          <div className="text-text-secondary text-xs mt-1">Oracle 带来的价值</div>
        </div>
      </div>

      {/* Attribution breakdown */}
      <div className="glass-card p-6 glow-border">
        <h3 className="font-bold mb-4">收益归因分解</h3>
        <div className="space-y-4">
          {data.attribution.map((a) => (
            <div key={a.factor}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-bold">{a.factor}</span>
                <span className={`text-sm font-mono font-bold ${a.contribution_pct >= 0 ? "text-risk-low" : "text-risk-critical"}`}>
                  {a.contribution_pct > 0 ? "+" : ""}{a.contribution_pct}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 bg-bg-secondary rounded-full overflow-hidden relative">
                  {a.contribution_pct >= 0 ? (
                    <div
                      className="absolute left-1/2 h-full bg-risk-low/60 rounded-full"
                      style={{ width: `${Math.min(50, a.contribution_pct * 10)}%` }}
                    />
                  ) : (
                    <div
                      className="absolute right-1/2 h-full bg-risk-critical/60 rounded-full"
                      style={{ width: `${Math.min(50, Math.abs(a.contribution_pct) * 10)}%` }}
                    />
                  )}
                </div>
              </div>
              <div className="text-text-secondary text-xs mt-1">{a.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rebalance events */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">调仓记录</h3>
          <span className="text-text-secondary text-sm">
            共 {data.total_rebalances} 次 · 累计止损 {data.total_saved_loss_pct}%
          </span>
        </div>
        <div className="space-y-3">
          {data.rebalance_events.map((e, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-bg-card/50">
              <div className="w-12 text-center">
                <div className="text-accent font-mono text-sm">D{e.day}</div>
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">{e.action}</div>
                <div className="text-text-secondary text-xs">
                  触发风险分: {e.risk_score_at_time}
                </div>
              </div>
              <div className="text-right">
                {e.saved_loss_pct > 0 ? (
                  <span className="text-risk-low font-bold text-sm">
                    避免 -{e.saved_loss_pct}%
                  </span>
                ) : (
                  <span className="text-text-secondary text-sm">恢复仓位</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
