import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { riskColor } from "../../lib/format";
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

  if (!symbol) return <div className="placeholder">选择一个资产查看风险分解</div>;
  if (isLoading) return <div className="loading">加载风险分解...</div>;
  if (error) return <div className="error">风险分解不可用</div>;
  if (!data) return null;

  return (
    <section className="risk-breakdown">
      <h2>{data.symbol} 风险分解</h2>
      <div className="risk-breakdown__summary">
        <span className="risk-breakdown__score" style={{ color: riskColor(data.risk_level) }}>
          综合评分: {data.composite_score.toFixed(1)}
        </span>
        <span className="risk-breakdown__level">{data.risk_level.toUpperCase()}</span>
      </div>
      <div className="risk-breakdown__contributions">
        {data.contributions.map((c) => (
          <ContributionBar key={c.source} item={c} />
        ))}
      </div>
    </section>
  );
}
