import { SystemRisk } from "../../api/client";

interface SystemRiskBannerProps {
  risk: SystemRisk;
}

const levelColors: Record<string, string> = {
  critical: "var(--color-risk-critical)",
  high: "var(--color-risk-high)",
  medium: "var(--color-risk-medium)",
  low: "var(--color-risk-low)",
};

export function SystemRiskBanner({ risk }: SystemRiskBannerProps) {
  const color = levelColors[risk.level] || "var(--color-text-secondary)";

  return (
    <div className="glass-card p-4 mb-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl font-bold" style={{ color }}>
          {risk.score.toFixed(0)}
        </span>
        <span className="text-sm font-bold" style={{ color }}>
          {risk.level.toUpperCase()}
        </span>
      </div>
      <p className="text-sm text-text-secondary mb-3">{risk.description}</p>
      <div className="flex gap-4 flex-wrap text-xs text-text-secondary">
        <span>平均相关性: {risk.avg_correlation.toFixed(2)}</span>
        <span>最大相关性: {risk.max_correlation.toFixed(2)}</span>
        <span>年化波动率: {(risk.portfolio_volatility * 100).toFixed(1)}%</span>
        <span>分散化比率: {risk.diversification_ratio.toFixed(2)}</span>
        <span>VaR(95%): {(risk.daily_var_95 * 100).toFixed(2)}%</span>
      </div>
    </div>
  );
}
