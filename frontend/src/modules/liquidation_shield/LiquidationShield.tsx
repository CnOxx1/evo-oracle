import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { ShieldStatus } from "./ShieldStatus";
import { AssetRiskTable } from "./AssetRiskTable";

export function LiquidationShield() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["liquidation-shield"],
    queryFn: api.liquidationShield,
  });

  if (isLoading) return <div className="text-center py-8 text-text-secondary animate-pulse">加载清算保护数据...</div>;
  if (error) return <div className="text-center py-8 text-risk-high">清算保护数据不可用</div>;
  if (!data) return null;

  return (
    <section className="animate-fade-in">
      <h2 className="text-xl font-bold mb-1 gradient-text">Liquidation Cascade Shield</h2>
      <p className="text-text-secondary text-sm mb-4">
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
