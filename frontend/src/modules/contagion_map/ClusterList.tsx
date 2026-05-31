import { ContagionCluster } from "../../api/client";

interface ClusterListProps {
  clusters: ContagionCluster[];
}

const riskBgClasses: Record<string, string> = {
  high: "bg-risk-high",
  medium: "bg-risk-medium",
  low: "bg-risk-low",
};

const phaseLabels: Record<string, string> = {
  leading: "领涨",
  lagging: "滞后",
  improving: "改善中",
  weakening: "走弱中",
};

export function ClusterList({ clusters }: ClusterListProps) {
  return (
    <div className="glass-card p-5">
      <h4 className="text-sm text-text-secondary font-semibold mb-4">板块传导风险</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {clusters.map((c) => (
          <div key={c.sector} className="bg-bg-secondary rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-sm">{c.sector}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[0.6rem] font-bold text-black ${riskBgClasses[c.contagion_risk] || "bg-text-secondary"}`}
              >
                {c.contagion_risk}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-[0.7rem] text-text-secondary mb-2">
              <span>阶段: {phaseLabels[c.phase] || c.phase}</span>
              <span>动量: {c.momentum_score.toFixed(2)}</span>
              <span>内部相关性: {c.avg_intra_correlation.toFixed(2)}</span>
              <span>7D回报: {(c.return_7d * 100).toFixed(2)}%</span>
            </div>
            <div className="h-0.5 bg-bg-primary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${riskBgClasses[c.contagion_risk] || "bg-text-secondary"}`}
                style={{ width: `${Math.min(c.contagion_score * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
