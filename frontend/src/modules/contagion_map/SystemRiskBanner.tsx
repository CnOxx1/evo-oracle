import { SystemRisk } from "../../api/client";

interface SystemRiskBannerProps {
  risk: SystemRisk;
}

const levelBorderClass: Record<string, string> = {
  critical: "border-l-risk-critical",
  high: "border-l-risk-high",
  medium: "border-l-risk-medium",
  low: "border-l-risk-low",
};

const levelTextClass: Record<string, string> = {
  critical: "text-risk-critical",
  high: "text-risk-high",
  medium: "text-risk-medium",
  low: "text-risk-low",
};

export function SystemRiskBanner({ risk }: SystemRiskBannerProps) {
  const borderCls = levelBorderClass[risk.level] || "border-l-text-secondary";
  const textCls = levelTextClass[risk.level] || "text-text-secondary";

  return (
    <div className={`glass-card p-4 mb-6 border-l-4 ${borderCls}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className={`text-3xl font-bold ${textCls}`}>
          {risk.score.toFixed(0)}
        </span>
        <span className={`text-sm font-bold ${textCls}`}>
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
