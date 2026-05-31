import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { VaultCard } from "./VaultCard";
import { PnLCompareChart } from "./PnLCompareChart";
import { VaultDeposit } from "./VaultDeposit";
import { useAuth } from "../auth/AuthProvider";

export function VaultUI() {
  const { address } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["vault-state"],
    queryFn: api.vaultState,
  });

  if (isLoading) return <div className="loading">加载 Vault 状态...</div>;
  if (error) return <div className="error">Vault 不可用</div>;
  if (!data) return null;

  return (
    <section className="vault-ui">
      <h2>RiskVault 仓位对比</h2>
      <p className="subtitle">动态风险调仓 vs 静态 50/50 策略</p>
      <div className="vault-grid">
        <VaultCard
          title="Protected (动态)"
          sui_pct={data.protected.sui_pct}
          usdc_pct={data.protected.usdc_pct}
          pnl_7d={data.protected.pnl_7d}
          variant="protected"
        />
        <VaultCard
          title="Static 50/50"
          sui_pct={data.static.sui_pct}
          usdc_pct={data.static.usdc_pct}
          pnl_7d={data.static.pnl_7d}
          variant="static"
        />
      </div>
      <PnLCompareChart vault={data} />
      <VaultDeposit
        walletAddress={address}
        signAndExecute={null}
        onSuccess={() => refetch()}
      />
    </section>
  );
}
