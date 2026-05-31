import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { WhaleBiasBanner } from "./WhaleBiasBanner";
import { SignalList } from "./SignalList";

export function WhaleSignal() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["whale-signals"],
    queryFn: api.whaleSignals,
  });

  if (isLoading) return <div className="text-center py-8 text-text-secondary animate-pulse">加载鲸鱼信号...</div>;
  if (error) return <div className="text-center py-8 text-risk-high">鲸鱼信号数据不可用</div>;
  if (!data) return null;

  return (
    <section className="animate-fade-in">
      <h2 className="text-xl font-bold mb-1 gradient-text">Whale Risk Signal</h2>
      <p className="text-text-secondary text-sm mb-4">
        {data.active_whale_count}/{data.total_assets} 资产检测到鲸鱼活动 |
        积累 {data.accumulating_count} | 派发 {data.distributing_count}
      </p>
      <WhaleBiasBanner
        bias={data.market_whale_bias}
        implication={data.risk_implication}
        accumulating={data.accumulating_count}
        distributing={data.distributing_count}
      />
      <SignalList signals={data.signals} />
    </section>
  );
}
