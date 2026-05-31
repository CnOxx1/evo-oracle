interface ShieldStatusProps {
  status: "active" | "warning" | "safe";
  action: string;
  cascadeRisk: { score: number; level: string; high_risk_assets: number; avg_risk_score: number };
  context: { daily_var_95: number; daily_var_99: number; annualized_volatility: number; avg_correlation: number };
}

const statusConfig = {
  active: { color: "var(--color-risk-critical)", label: "ACTIVE", icon: "⚠" },
  warning: { color: "var(--color-risk-medium)", label: "WARNING", icon: "△" },
  safe: { color: "var(--color-risk-low)", label: "SAFE", icon: "✓" },
};

export function ShieldStatus({ status, action, cascadeRisk, context }: ShieldStatusProps) {
  const cfg = statusConfig[status];

  return (
    <div className="glass-card p-5 mb-6 border-l-4" style={{ borderLeftColor: cfg.color }}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl" style={{ color: cfg.color }}>{cfg.icon}</span>
        <span className="text-base font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
        <span className="ml-auto text-sm text-text-secondary">
          级联风险: {cascadeRisk.score.toFixed(0)}/100
        </span>
      </div>
      <p className="text-sm text-text-secondary mb-3">{action}</p>
      <div className="flex gap-6 flex-wrap">
        <div className="flex flex-col">
          <span className="text-[0.65rem] text-text-secondary">高风险资产</span>
          <span className="text-base font-bold">{cascadeRisk.high_risk_assets}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[0.65rem] text-text-secondary">VaR(95%)</span>
          <span className="text-base font-bold">{(context.daily_var_95 * 100).toFixed(2)}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[0.65rem] text-text-secondary">年化波动率</span>
          <span className="text-base font-bold">{(context.annualized_volatility * 100).toFixed(1)}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[0.65rem] text-text-secondary">平均相关性</span>
          <span className="text-base font-bold">{context.avg_correlation.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
}
