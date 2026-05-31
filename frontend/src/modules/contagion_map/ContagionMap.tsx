import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { CorrelationHeatmap } from "./CorrelationHeatmap";
import { ClusterList } from "./ClusterList";
import { SystemRiskBanner } from "./SystemRiskBanner";

export function ContagionMap() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["contagion-map"],
    queryFn: api.contagionMap,
  });

  if (isLoading) return <div className="text-center py-8 text-text-secondary animate-pulse">加载风险传导图...</div>;
  if (error) return <div className="text-center py-8 text-risk-high">传导图数据不可用</div>;
  if (!data) return null;

  return (
    <section className="animate-fade-in">
      <h2 className="text-xl font-bold mb-1 gradient-text">跨资产风险传导图</h2>
      <p className="text-text-secondary text-sm mb-4">
        {data.meta.total_assets} 资产 | {data.meta.high_corr_links} 条传导链路 | {data.meta.hedge_links} 条对冲链路
      </p>
      <SystemRiskBanner risk={data.system_risk} />
      <CorrelationHeatmap edges={data.edges} nodes={data.nodes} />
      <ClusterList clusters={data.clusters} />
    </section>
  );
}
