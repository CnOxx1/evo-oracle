import { fmtPct } from "../../lib/format";

interface VaultCardProps {
  title: string;
  sui_pct: number | null;
  usdc_pct: number | null;
  pnl_7d: number | null;
  variant: "protected" | "static";
}

export function VaultCard({ title, sui_pct, usdc_pct, pnl_7d, variant }: VaultCardProps) {
  const pnlColor = pnl_7d == null ? "var(--text-secondary)" : pnl_7d >= 0 ? "var(--risk-low)" : "var(--risk-high)";

  return (
    <div className={`vault-card vault-card--${variant}`}>
      <h3>{title}</h3>
      <div className="vault-card__alloc">
        <div className="vault-card__bar">
          <div className="vault-card__sui" style={{ width: `${sui_pct ?? 50}%` }}>
            SUI {fmtPct(sui_pct)}
          </div>
          <div className="vault-card__usdc" style={{ width: `${usdc_pct ?? 50}%` }}>
            USDC {fmtPct(usdc_pct)}
          </div>
        </div>
      </div>
      <div className="vault-card__pnl" style={{ color: pnlColor }}>
        7D PnL: {fmtPct(pnl_7d)}
      </div>
    </div>
  );
}
