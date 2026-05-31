import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { ShieldStatus } from "./ShieldStatus";
import { AssetRiskTable } from "./AssetRiskTable";

export function LiquidationShield() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["liquidation-shield"],
    queryFn: api.liquidationShield,
  });

  if (isLoading) return <div className="loading">加载清算保护数据...</div>;
  if (error) return <div className="error">清算保护数据不可用</div>;
  if (!data) return null;

  return (
    <section className="liquidation-shield">
      <h2>Liquidation Cascade Shield</h2>
      <p className="subtitle">
        基于资金费率 + VaR + 相关性的清算级联风险评估
      </p>
      <ShieldStatus
        status={data.shield_status}
        action={data.shield_action}
        cascadeRisk={data.cascade_risk}
        context={data.portfolio_context}
      />
      <AssetRiskTable assets={data.assets} />
    </section>
  );
}
