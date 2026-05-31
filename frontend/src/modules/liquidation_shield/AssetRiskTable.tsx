import { LiquidationAsset } from "../../api/client";

interface AssetRiskTableProps {
  assets: LiquidationAsset[];
}

const levelBgClasses: Record<string, string> = {
  critical: "bg-risk-critical",
  high: "bg-risk-high",
  medium: "bg-risk-medium",
  low: "bg-risk-low",
};

const levelTextClasses: Record<string, string> = {
  critical: "text-risk-critical",
  high: "text-risk-high",
  medium: "text-risk-medium",
  low: "text-risk-low",
};

export function AssetRiskTable({ assets }: AssetRiskTableProps) {
  return (
    <div className="glass-card p-5">
      <h4 className="text-sm text-text-secondary font-semibold mb-4">资产清算风险排名</h4>
      <div className="flex flex-col gap-2">
        {assets.map((a) => (
          <div key={a.symbol} className="flex items-center gap-3 py-1.5 border-b border-border last:border-b-0">
            <span className="font-semibold text-sm min-w-[50px]">{a.symbol}</span>
            <div className="flex-1 h-1 bg-bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${levelBgClasses[a.risk_level] || "bg-text-secondary"}`}
                style={{ width: `${a.liquidation_risk_score}%` }}
              />
            </div>
            <span className={`font-bold text-sm min-w-[30px] text-right ${levelTextClasses[a.risk_level] || "text-text-secondary"}`}>
              {a.liquidation_risk_score.toFixed(0)}
            </span>
            <span className="text-[0.7rem] text-text-secondary min-w-[70px]">
              {(a.annualized_rate * 100).toFixed(1)}% APR
            </span>
            <span className="text-[0.7rem] text-text-secondary min-w-[30px]">
              x{a.cascade_multiplier.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
