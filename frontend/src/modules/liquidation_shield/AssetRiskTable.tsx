import { LiquidationAsset } from "../../api/client";

interface AssetRiskTableProps {
  assets: LiquidationAsset[];
}

const levelColors: Record<string, string> = {
  critical: "var(--risk-critical)",
  high: "var(--risk-high)",
  medium: "var(--risk-medium)",
  low: "var(--risk-low)",
};

export function AssetRiskTable({ assets }: AssetRiskTableProps) {
  return (
    <div className="asset-risk-table">
      <h4>资产清算风险排名</h4>
      <div className="asset-risk-table__list">
        {assets.map((a) => (
          <div key={a.symbol} className="asset-risk-table__row">
            <span className="asset-risk-table__symbol">{a.symbol}</span>
            <div className="asset-risk-table__bar-wrap">
              <div
                className="asset-risk-table__bar"
                style={{
                  width: `${a.liquidation_risk_score}%`,
                  background: levelColors[a.risk_level] || "var(--text-secondary)",
                }}
              />
            </div>
            <span className="asset-risk-table__score" style={{ color: levelColors[a.risk_level] }}>
              {a.liquidation_risk_score.toFixed(0)}
            </span>
            <span className="asset-risk-table__rate">
              {(a.annualized_rate * 100).toFixed(1)}% APR
            </span>
            <span className="asset-risk-table__multiplier">
              x{a.cascade_multiplier.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
