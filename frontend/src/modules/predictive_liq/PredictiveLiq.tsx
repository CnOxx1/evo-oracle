import { useQuery } from "@tanstack/react-query";

interface AssetLiquidation {
  symbol: string;
  liquidation_probability: number;
  factors: {
    oi_contribution: number;
    funding_contribution: number;
    correlation_contribution: number;
    volatility_contribution: number;
  };
}

interface PredictiveLiqResponse {
  cascade_probability: number;
  cascade_risk_level: string;
  assets: AssetLiquidation[];
}

export function PredictiveLiq() {
  const { data, isLoading, error } = useQuery<PredictiveLiqResponse>({
    queryKey: ["predictive-liquidation"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || ""}/api/predictive-liquidation`
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
  });

  const riskTextClass = (level: string) => {
    switch (level) {
      case "critical": return "text-risk-critical";
      case "high": return "text-risk-high";
      case "medium": return "text-risk-medium";
      default: return "text-risk-low";
    }
  };

  const probTextClass = (prob: number) => {
    if (prob >= 0.7) return "text-risk-critical";
    if (prob >= 0.5) return "text-risk-high";
    if (prob >= 0.3) return "text-risk-medium";
    return "text-risk-low";
  };

  const probBgClass = (prob: number) => {
    if (prob >= 0.7) return "bg-risk-critical";
    if (prob >= 0.5) return "bg-risk-high";
    if (prob >= 0.3) return "bg-risk-medium";
    return "bg-risk-low";
  };

  if (isLoading) return <div className="text-center py-8 text-text-secondary animate-pulse">加载清算预测...</div>;
  if (error) return <div className="text-center py-8 text-risk-high">清算预测服务不可用</div>;

  const sorted = [...(data?.assets ?? [])].sort(
    (a, b) => b.liquidation_probability - a.liquidation_probability
  );

  return (
    <section className="animate-fade-in max-w-[900px]">
      <h2 className="text-xl font-bold mb-4 gradient-text">预测性清算告警</h2>

      <div className="glass-card p-5 mb-6 flex items-center gap-4">
        <span className="text-sm text-text-secondary">全局级联概率</span>
        <span
          className={`text-3xl font-bold ${riskTextClass(data?.cascade_risk_level ?? "low")}`}
        >
          {((data?.cascade_probability ?? 0) * 100).toFixed(1)}%
        </span>
        <span
          className={`text-sm font-bold uppercase ${riskTextClass(data?.cascade_risk_level ?? "low")}`}
        >
          {data?.cascade_risk_level?.toUpperCase()}
        </span>
      </div>

      <div className="space-y-3">
        {sorted.map((asset) => (
          <div key={asset.symbol} className="glass-card p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm">{asset.symbol}</span>
              <span className={`font-bold ${probTextClass(asset.liquidation_probability)}`}>
                {(asset.liquidation_probability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-1 bg-bg-secondary rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-300 ${probBgClass(asset.liquidation_probability)}`}
                style={{ width: `${asset.liquidation_probability * 100}%` }}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <FactorTag label="OI" value={asset.factors.oi_contribution} />
              <FactorTag label="Funding" value={asset.factors.funding_contribution} />
              <FactorTag label="Corr" value={asset.factors.correlation_contribution} />
              <FactorTag label="Vol" value={asset.factors.volatility_contribution} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FactorTag({ label, value }: { label: string; value: number }) {
  const opacity = Math.min(1, 0.3 + value * 0.7);
  return (
    <span className="text-[0.7rem] bg-bg-secondary px-2 py-0.5 rounded" style={{ opacity }}>
      {label}: {(value * 100).toFixed(0)}%
    </span>
  );
}
