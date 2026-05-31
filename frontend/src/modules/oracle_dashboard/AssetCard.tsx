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
    <div
      className="glass-card p-5 cursor-pointer hover:border-accent/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]"
      onClick={() => onSelect(asset.symbol)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-text-primary">{asset.symbol}</h3>
        <span className="text-sm text-accent">{trend}</span>
      </div>
      <RiskBar score={asset.risk_score} level={asset.risk_level} />
      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-text-secondary">
        <span>宏观: {asset.macro_stance}</span>
        <span>波动率: {(vol * 100).toFixed(1)}%</span>
        {fundingAnomaly && (
          <span className="px-2 py-0.5 rounded-full bg-risk-high/20 text-risk-high font-medium">资金费异常</span>
        )}
      </div>
      <div className="mt-2 text-xs text-text-secondary/60">{fmtTime(asset.generated_at)}</div>
    </div>
  );
}
