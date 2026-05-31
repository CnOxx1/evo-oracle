import { ContagionEdge, ContagionNode } from "../../api/client";

interface CorrelationHeatmapProps {
  edges: ContagionEdge[];
  nodes: ContagionNode[];
}

export function CorrelationHeatmap({ edges, nodes }: CorrelationHeatmapProps) {
  // 取 top 20 条最强链路展示
  const topEdges = edges.slice(0, 20);

  return (
    <div className="correlation-heatmap">
      <h4>高相关性链路 (|r| &ge; 0.7)</h4>
      <div className="correlation-heatmap__grid">
        {topEdges.map((edge, i) => {
          const isStrong = edge.strength === "strong";
          const color = edge.risk_type === "contagion"
            ? isStrong ? "var(--risk-critical)" : "var(--risk-high)"
            : "var(--risk-low)";
          const opacity = Math.abs(edge.correlation);

          return (
            <div key={i} className="correlation-heatmap__item" style={{ borderLeftColor: color }}>
              <div className="correlation-heatmap__pair">
                <span className="correlation-heatmap__asset">{edge.source}</span>
                <span className="correlation-heatmap__arrow" style={{ color }}>
                  {edge.risk_type === "contagion" ? "↔" : "⇋"}
                </span>
                <span className="correlation-heatmap__asset">{edge.target}</span>
              </div>
              <div className="correlation-heatmap__bar">
                <div
                  className="correlation-heatmap__fill"
                  style={{ width: `${opacity * 100}%`, background: color }}
                />
              </div>
              <div className="correlation-heatmap__meta">
                <span style={{ color }}>{edge.correlation.toFixed(3)}</span>
                <span className={`correlation-heatmap__tag correlation-heatmap__tag--${edge.risk_type}`}>
                  {edge.risk_type === "contagion" ? "传导" : "对冲"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="correlation-heatmap__legend">
        <span>资产总数: {nodes.length}</span>
        <span>传导链路: {edges.filter(e => e.risk_type === "contagion").length}</span>
        <span>对冲链路: {edges.filter(e => e.risk_type === "hedge").length}</span>
      </div>
    </div>
  );
}
