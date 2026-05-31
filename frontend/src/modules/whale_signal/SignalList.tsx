import { WhaleSignal } from "../../api/client";

interface SignalListProps {
  signals: WhaleSignal[];
}

const actionColors: Record<string, string> = {
  accumulating: "var(--color-risk-low)",
  distributing: "var(--color-risk-high)",
  repositioning: "var(--color-risk-medium)",
  inactive: "var(--color-text-secondary)",
};

const actionLabels: Record<string, string> = {
  accumulating: "吸筹",
  distributing: "派发",
  repositioning: "调仓",
  inactive: "无活动",
};

export function SignalList({ signals }: SignalListProps) {
  const active = signals.filter((s) => s.whale_action !== "inactive");
  const inactive = signals.filter((s) => s.whale_action === "inactive");

  return (
    <div className="glass-card p-5">
      <h4 className="text-sm text-text-secondary font-semibold mb-4">鲸鱼活动信号</h4>
      <div className="flex flex-col gap-2">
        {active.map((s) => (
          <div key={s.symbol} className="bg-bg-secondary border-l-3 rounded p-3"
            style={{ borderLeftColor: actionColors[s.whale_action] }}>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-bold text-sm">{s.symbol}</span>
              <span className="text-xs font-semibold"
                style={{ color: actionColors[s.whale_action] }}>
                {actionLabels[s.whale_action]}
              </span>
              <span className="ml-auto text-sm text-text-secondary">
                {s.signal_strength.toFixed(0)}
              </span>
            </div>
            <div className="flex gap-3 text-[0.7rem] text-text-secondary flex-wrap">
              <span>RS(7d): {s.rs_7d.toFixed(2)}</span>
              <span>RS(1d): {s.rs_1d.toFixed(2)}</span>
              <span>资金费: {s.funding_bias}</span>
              <span>7D: {((s.price_change_7d || 0) * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
      {inactive.length > 0 && (
        <p className="mt-3 text-xs text-text-secondary">
          另有 {inactive.length} 资产无明显鲸鱼活动
        </p>
      )}
    </div>
  );
}
