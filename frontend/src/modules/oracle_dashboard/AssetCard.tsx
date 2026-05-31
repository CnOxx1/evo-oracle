import { OracleAsset } from "../../api/client";
import { fmtTime } from "../../lib/format";
import { RiskBar } from "./RiskBar";

interface AssetCardProps {
  asset: OracleAsset;
  onSelect: (symbol: string) => void;
}

function extractTrend(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object" && "direction" in raw) return String((raw as Record<string, unknown>).direction);
  return "—";
}

function extractVol(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (raw && typeof raw === "object" && "annualized_vol" in raw) return Number((raw as Record<string, unknown>).annualized_vol);
  return 0;
}

function extractFunding(raw: unknown): boolean {
  if (typeof raw === "boolean") return raw;
  if (raw && typeof raw === "object" && "is_anomaly" in raw) return Boolean((raw as Record<string, unknown>).is_anomaly);
  return false;
}

export function AssetCard({ asset, onSelect }: AssetCardProps) {
  const trend = extractTrend(asset.trend_signal);
  const vol = extractVol(asset.volatility);
  const fundingAnomaly = extractFunding(asset.funding_anomaly);

  return (
    <div className="asset-card" onClick={() => onSelect(asset.symbol)}>
      <div className="asset-card__header">
        <h3>{asset.symbol}</h3>
        <span className="asset-card__trend">{trend}</span>
      </div>
      <RiskBar score={asset.risk_score} level={asset.risk_level} />
      <div className="asset-card__meta">
        <span>宏观: {asset.macro_stance}</span>
        <span>波动率: {(vol * 100).toFixed(1)}%</span>
        {fundingAnomaly && <span className="badge-warning">资金费异常</span>}
      </div>
      <div className="asset-card__time">{fmtTime(asset.generated_at)}</div>
    </div>
  );
}
