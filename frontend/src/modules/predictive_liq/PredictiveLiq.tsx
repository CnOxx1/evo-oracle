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

  const riskColor = (level: string) => {
    switch (level) {
      case "critical": return "var(--risk-critical)";
      case "high": return "var(--risk-high)";
      case "medium": return "var(--risk-medium)";
      default: return "var(--risk-low)";
    }
  };

  const probColor = (prob: number) => {
    if (prob >= 0.7) return "var(--risk-critical)";
    if (prob >= 0.5) return "var(--risk-high)";
    if (prob >= 0.3) return "var(--risk-medium)";
    return "var(--risk-low)";
  };

  if (isLoading) return <div className="loading">加载清算预测...</div>;
  if (error) return <div className="error">清算预测服务不可用</div>;

  const sorted = [...(data?.assets ?? [])].sort(
    (a, b) => b.liquidation_probability - a.liquidation_probability
  );

  return (
    <section className="predictive-liq">
      <h2 className="predictive-liq__title">预测性清算告警</h2>

      <div className="predictive-liq__global">
        <span className="predictive-liq__global-label">全局级联概率</span>
        <span
          className="predictive-liq__global-value"
          style={{ color: riskColor(data?.cascade_risk_level ?? "low") }}
        >
          {((data?.cascade_probability ?? 0) * 100).toFixed(1)}%
        </span>
        <span
          className="predictive-liq__global-level"
          style={{ color: riskColor(data?.cascade_risk_level ?? "low") }}
        >
          {data?.cascade_risk_level?.toUpperCase()}
        </span>
      </div>

      <div className="predictive-liq__list">
        {sorted.map((asset) => (
          <div key={asset.symbol} className="predictive-liq__item">
            <div className="predictive-liq__item-header">
              <span className="predictive-liq__symbol">{asset.symbol}</span>
              <span
                className="predictive-liq__prob"
                style={{ color: probColor(asset.liquidation_probability) }}
              >
                {(asset.liquidation_probability * 100).toFixed(1)}%
              </span>
            </div>

            <div className="predictive-liq__bar-wrap">
              <div
                className="predictive-liq__bar"
                style={{
                  width: `${asset.liquidation_probability * 100}%`,
                  background: probColor(asset.liquidation_probability),
                }}
              />
            </div>

            <div className="predictive-liq__factors">
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
    <span className="predictive-liq__factor" style={{ opacity }}>
      {label}: {(value * 100).toFixed(0)}%
    </span>
  );
}
