import { ContagionCluster } from "../../api/client";

interface ClusterListProps {
  clusters: ContagionCluster[];
}

const riskColors: Record<string, string> = {
  high: "var(--risk-high)",
  medium: "var(--risk-medium)",
  low: "var(--risk-low)",
};

const phaseLabels: Record<string, string> = {
  leading: "领涨",
  lagging: "滞后",
  improving: "改善中",
  weakening: "走弱中",
};

export function ClusterList({ clusters }: ClusterListProps) {
  return (
    <div className="cluster-list">
      <h4>板块传导风险</h4>
      <div className="cluster-list__grid">
        {clusters.map((c) => (
          <div key={c.sector} className="cluster-list__item">
            <div className="cluster-list__header">
              <span className="cluster-list__sector">{c.sector}</span>
              <span
                className="cluster-list__risk-badge"
                style={{ background: riskColors[c.contagion_risk] || "var(--text-secondary)" }}
              >
                {c.contagion_risk}
              </span>
            </div>
            <div className="cluster-list__metrics">
              <span>阶段: {phaseLabels[c.phase] || c.phase}</span>
              <span>动量: {c.momentum_score.toFixed(2)}</span>
              <span>内部相关性: {c.avg_intra_correlation.toFixed(2)}</span>
              <span>7D回报: {(c.return_7d * 100).toFixed(2)}%</span>
            </div>
            <div className="cluster-list__bar">
              <div
                className="cluster-list__fill"
                style={{
                  width: `${Math.min(c.contagion_score * 100, 100)}%`,
                  background: riskColors[c.contagion_risk],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
