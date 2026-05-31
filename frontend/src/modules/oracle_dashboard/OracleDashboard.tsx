import { useQuery } from "@tanstack/react-query";
import { api, OracleAsset } from "../../api/client";
import { AssetCard } from "./AssetCard";

interface OracleDashboardProps {
  onSelectSymbol: (symbol: string) => void;
}

export function OracleDashboard({ onSelectSymbol }: OracleDashboardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["oracle-all"],
    queryFn: api.oracleAll,
  });

  if (isLoading) return <div className="text-text-secondary animate-pulse p-8 text-center">加载 Oracle 数据...</div>;
  if (error) return <div className="text-risk-high p-8 text-center">Oracle 不可用: {String(error)}</div>;

  const assets = Object.values(data?.oracles ?? {}).filter(
    (a): a is OracleAsset => !("error" in a),
  );

  return (
    <section className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Oracle 监控面板</h2>
        <p className="text-text-secondary mt-1">追踪 {data?.symbol_count ?? 0} 个资产的实时风险信号</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((asset) => (
          <AssetCard key={asset.symbol} asset={asset} onSelect={onSelectSymbol} />
        ))}
      </div>
    </section>
  );
}
