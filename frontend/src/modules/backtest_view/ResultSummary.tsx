import { BacktestSummary } from "../../api/client";

interface ResultSummaryProps {
  summary: BacktestSummary;
}

export function ResultSummary({ summary }: ResultSummaryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="glass-card p-4 glow-border-hover">
        <span className="block text-xs text-text-secondary mb-1">Protected 最终 PnL</span>
        <span className="text-2xl font-bold text-risk-low">
          {summary.protected_final.toFixed(1)}%
        </span>
      </div>
      <div className="glass-card p-4 glow-border-hover">
        <span className="block text-xs text-text-secondary mb-1">Static 最终 PnL</span>
        <span className="text-2xl font-bold text-risk-critical">
          {summary.static_final.toFixed(1)}%
        </span>
      </div>
      <div className="glass-card p-4 glow-border">
        <span className="block text-xs text-text-secondary mb-1">避免最大回撤</span>
        <span className="text-2xl font-bold text-accent">
          {summary.max_drawdown_avoided.toFixed(1)}%
        </span>
      </div>
      <div className="glass-card p-4 glow-border-hover">
        <span className="block text-xs text-text-secondary mb-1">保护触发次数</span>
        <span className="text-2xl font-bold text-severity-warning">
          {summary.actions_taken}
        </span>
      </div>
    </div>
  );
}
