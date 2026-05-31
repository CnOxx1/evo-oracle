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

  if (isLoading) return <div className="loading">加载 Oracle 数据...</div>;
  if (error) return <div className="error">Oracle 不可用: {String(error)}</div>;

  const assets = Object.values(data?.oracles ?? {}).filter(
    (a): a is OracleAsset => !("error" in a),
  );

  return (
    <section className="oracle-dashboard">
      <h2>Oracle 监控面板</h2>
      <p className="subtitle">追踪 {data?.symbol_count ?? 0} 个资产的实时风险信号</p>
      <div className="asset-grid">
        {assets.map((asset) => (
          <AssetCard key={asset.symbol} asset={asset} onSelect={onSelectSymbol} />
        ))}
      </div>
    </section>
  );
}
