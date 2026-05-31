import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { riskTextClass } from "../../lib/format";
import { ContributionBar } from "./ContributionBar";

interface RiskBreakdownProps {
  symbol: string;
}

export function RiskBreakdown({ symbol }: RiskBreakdownProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["risk-breakdown", symbol],
    queryFn: () => api.riskBreakdown(symbol),
    enabled: !!symbol,
  });

  if (!symbol) return <div className="text-text-secondary p-8 text-center">选择一个资产查看风险分解</div>;
  if (isLoading) return <div className="text-text-secondary animate-pulse p-8 text-center">加载风险分解...</div>;
  if (error) return <div className="text-risk-high p-8 text-center">风险分解不可用</div>;
  if (!data) return null;

  return (
    <section className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text">{data.symbol} 风险分解</h2>
        <div className="flex items-center gap-4 mt-2">
          <span className={`text-lg font-bold ${riskTextClass(data.risk_level)}`}>
            综合评分: {data.composite_score.toFixed(1)}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-bold bg-bg-secondary ${riskTextClass(data.risk_level)}`}>
            {data.risk_level.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="space-y-3">
        {data.contributions.map((c) => (
          <ContributionBar key={c.source} item={c} />
        ))}
      </div>
    </section>
  );
}
