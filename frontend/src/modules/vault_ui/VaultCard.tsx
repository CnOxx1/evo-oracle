import { fmtPct } from "../../lib/format";

interface VaultCardProps {
  title: string;
  sui_pct: number | null;
  usdc_pct: number | null;
  pnl_7d: number | null;
  variant: "protected" | "static";
}

export function VaultCard({ title, sui_pct, usdc_pct, pnl_7d, variant }: VaultCardProps) {
  const pnlColor = pnl_7d == null ? "text-text-secondary" : pnl_7d >= 0 ? "text-risk-low" : "text-risk-high";
  const borderTop = variant === "protected" ? "border-t-accent" : "border-t-text-secondary";

  return (
    <div className={`bg-bg-card/50 backdrop-blur-md border border-accent/10 rounded-xl p-4 border-t-3 ${borderTop}`}>
      <h3 className="font-semibold mb-3 text-text-primary">{title}</h3>
      <div className="flex rounded-md overflow-hidden h-7 text-[0.7rem] font-semibold">
        <div className="bg-accent flex items-center justify-center text-white" style={{ width: `${sui_pct ?? 50}%` }}>
          SUI {fmtPct(sui_pct)}
        </div>
        <div className="bg-risk-low flex items-center justify-center text-black" style={{ width: `${usdc_pct ?? 50}%` }}>
          USDC {fmtPct(usdc_pct)}
        </div>
      </div>
      <div className={`mt-3 text-lg font-bold ${pnlColor}`}>
        7D PnL: {fmtPct(pnl_7d)}
      </div>
    </div>
  );
}
