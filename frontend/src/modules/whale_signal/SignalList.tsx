import { WhaleSignal } from "../../api/client";

interface SignalListProps {
  signals: WhaleSignal[];
}

const actionColors: Record<string, string> = {
  accumulating: "var(--risk-low)",
  distributing: "var(--risk-high)",
  repositioning: "var(--risk-medium)",
  inactive: "var(--text-secondary)",
};

const actionLabels: Record<string, string> = {
  accumulating: "吸筹",
  distributing: "派发",
  repositioning: "调仓",
  inactive: "无活动",
};

export function SignalList({ signals }: SignalListProps) {
  // 只展示有活动的信号
  const active = signals.filter((s) => s.whale_action !== "inactive");
  const inactive = signals.filter((s) => s.whale_action === "inactive");

  return (
    <div className="signal-list">
      <h4>鲸鱼活动信号</h4>
      <div className="signal-list__grid">
        {active.map((s) => (
          <div key={s.symbol} className="signal-list__item signal-list__item--active"
            style={{ borderLeftColor: actionColors[s.whale_action] }}>
            <div className="signal-list__header">
              <span className="signal-list__symbol">{s.symbol}</span>
              <span className="signal-list__action"
                style={{ color: actionColors[s.whale_action] }}>
                {actionLabels[s.whale_action]}
              </span>
              <span className="signal-list__strength">
                {s.signal_strength.toFixed(0)}
              </span>
            </div>
            <div className="signal-list__meta">
              <span>RS(7d): {s.rs_7d.toFixed(2)}</span>
              <span>RS(1d): {s.rs_1d.toFixed(2)}</span>
              <span>资金费: {s.funding_bias}</span>
              <span>7D: {((s.price_change_7d || 0) * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
      {inactive.length > 0 && (
        <p className="signal-list__inactive-count">
          另有 {inactive.length} 资产无明显鲸鱼活动
        </p>
      )}
    </div>
  );
}
