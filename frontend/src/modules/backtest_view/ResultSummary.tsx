import { BacktestSummary } from "../../api/client";

interface ResultSummaryProps {
  summary: BacktestSummary;
}

export function ResultSummary({ summary }: ResultSummaryProps) {
  return (
    <div className="result-summary">
      <div className="result-summary__item">
        <span className="result-summary__label">Protected 最终 PnL</span>
        <span className="result-summary__value" style={{ color: "var(--risk-low)" }}>
          {summary.protected_final.toFixed(1)}%
        </span>
      </div>
      <div className="result-summary__item">
        <span className="result-summary__label">Static 最终 PnL</span>
        <span className="result-summary__value" style={{ color: "var(--risk-critical)" }}>
          {summary.static_final.toFixed(1)}%
        </span>
      </div>
      <div className="result-summary__item result-summary__highlight">
        <span className="result-summary__label">避免最大回撤</span>
        <span className="result-summary__value" style={{ color: "var(--accent)" }}>
          {summary.max_drawdown_avoided.toFixed(1)}%
        </span>
      </div>
      <div className="result-summary__item">
        <span className="result-summary__label">保护触发次数</span>
        <span className="result-summary__value" style={{ color: "var(--severity-warning)" }}>
          {summary.actions_taken}
        </span>
      </div>
    </div>
  );
}
