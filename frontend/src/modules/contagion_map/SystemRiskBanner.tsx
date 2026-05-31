import { SystemRisk } from "../../api/client";

interface SystemRiskBannerProps {
  risk: SystemRisk;
}

const levelColors: Record<string, string> = {
  critical: "var(--risk-critical)",
  high: "var(--risk-high)",
  medium: "var(--risk-medium)",
  low: "var(--risk-low)",
};

export function SystemRiskBanner({ risk }: SystemRiskBannerProps) {
  const color = levelColors[risk.level] || "var(--text-secondary)";

  return (
    <div className="system-risk-banner" style={{ borderLeftColor: color }}>
      <div className="system-risk-banner__header">
        <span className="system-risk-banner__score" style={{ color }}>
          {risk.score.toFixed(0)}
        </span>
        <span className="system-risk-banner__level" style={{ color }}>
          {risk.level.toUpperCase()}
        </span>
      </div>
      <p className="system-risk-banner__desc">{risk.description}</p>
      <div className="system-risk-banner__metrics">
        <span>平均相关性: {risk.avg_correlation.toFixed(2)}</span>
        <span>最大相关性: {risk.max_correlation.toFixed(2)}</span>
        <span>年化波动率: {(risk.portfolio_volatility * 100).toFixed(1)}%</span>
        <span>分散化比率: {risk.diversification_ratio.toFixed(2)}</span>
        <span>VaR(95%): {(risk.daily_var_95 * 100).toFixed(2)}%</span>
      </div>
    </div>
  );
}
