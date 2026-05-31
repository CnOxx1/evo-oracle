import { ContagionEdge, ContagionNode } from "../../api/client";

interface CorrelationHeatmapProps {
  edges: ContagionEdge[];
  nodes: ContagionNode[];
}

export function CorrelationHeatmap({ edges, nodes }: CorrelationHeatmapProps) {
  const topEdges = edges.slice(0, 20);

  return (
    <div className="glass-card p-5 mb-6">
      <h4 className="text-sm text-text-secondary font-semibold mb-4">高相关性链路 (|r| &ge; 0.7)</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {topEdges.map((edge, i) => {
          const isStrong = edge.strength === "strong";
          const color = edge.risk_type === "contagion"
            ? isStrong ? "var(--color-risk-critical)" : "var(--color-risk-high)"
            : "var(--color-risk-low)";
          const opacity = Math.abs(edge.correlation);

          return (
            <div key={i} className="bg-bg-secondary border-l-3 rounded p-2" style={{ borderLeftColor: color }}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-semibold text-xs">{edge.source}</span>
                <span className="text-sm" style={{ color }}>
                  {edge.risk_type === "contagion" ? "↔" : "⇋"}
                </span>
                <span className="font-semibold text-xs">{edge.target}</span>
              </div>
              <div className="h-0.5 bg-bg-primary rounded-full overflow-hidden mb-1">
                <div className="h-full rounded-full" style={{ width: `${opacity * 100}%`, background: color }} />
              </div>
              <div className="flex justify-between text-[0.7rem]">
                <span style={{ color }}>{edge.correlation.toFixed(3)}</span>
                <span className={`px-1 rounded text-[0.6rem] font-bold ${
                  edge.risk_type === "contagion" ? "bg-risk-high/20 text-risk-high" : "bg-risk-low/20 text-risk-low"
                }`}>
                  {edge.risk_type === "contagion" ? "传导" : "对冲"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-6 mt-4 text-xs text-text-secondary">
        <span>资产总数: {nodes.length}</span>
        <span>传导链路: {edges.filter(e => e.risk_type === "contagion").length}</span>
        <span>对冲链路: {edges.filter(e => e.risk_type === "hedge").length}</span>
      </div>
    </div>
  );
}
