interface ShieldStatusProps {
  status: "active" | "warning" | "safe";
  action: string;
  cascadeRisk: { score: number; level: string; high_risk_assets: number; avg_risk_score: number };
  context: { daily_var_95: number; daily_var_99: number; annualized_volatility: number; avg_correlation: number };
}

const statusConfig = {
  active: { color: "var(--risk-critical)", label: "ACTIVE", icon: "⚠" },
  warning: { color: "var(--risk-medium)", label: "WARNING", icon: "△" },
  safe: { color: "var(--risk-low)", label: "SAFE", icon: "✓" },
};

export function ShieldStatus({ status, action, cascadeRisk, context }: ShieldStatusProps) {
  const cfg = statusConfig[status];

  return (
    <div className="shield-status" style={{ borderLeftColor: cfg.color }}>
      <div className="shield-status__header">
        <span className="shield-status__icon" style={{ color: cfg.color }}>{cfg.icon}</span>
        <span className="shield-status__label" style={{ color: cfg.color }}>{cfg.label}</span>
        <span className="shield-status__score">
          级联风险: {cascadeRisk.score.toFixed(0)}/100
        </span>
      </div>
      <p className="shield-status__action">{action}</p>
      <div className="shield-status__metrics">
        <div className="shield-status__metric">
          <span className="shield-status__metric-label">高风险资产</span>
          <span className="shield-status__metric-value">{cascadeRisk.high_risk_assets}</span>
        </div>
        <div className="shield-status__metric">
          <span className="shield-status__metric-label">VaR(95%)</span>
          <span className="shield-status__metric-value">{(context.daily_var_95 * 100).toFixed(2)}%</span>
        </div>
        <div className="shield-status__metric">
          <span className="shield-status__metric-label">年化波动率</span>
          <span className="shield-status__metric-value">{(context.annualized_volatility * 100).toFixed(1)}%</span>
        </div>
        <div className="shield-status__metric">
          <span className="shield-status__metric-label">平均相关性</span>
          <span className="shield-status__metric-value">{context.avg_correlation.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
}
