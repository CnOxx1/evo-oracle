import { useQuery } from "@tanstack/react-query";

interface OverviewData {
  system_risk_score: number;
  system_risk_level: string;
  macro_stance: string;
  portfolio_var_95: number;
  annualized_volatility: number;
  high_risk_asset_count: number;
  total_tracked_assets: number;
  active_alerts: number;
  data_source_status: string;
}

export function Overview() {
  const { data, isLoading, error } = useQuery<OverviewData>({
    queryKey: ["overview"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || ""}/api/overview`
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
    refetchInterval: 30000,
  });

  const riskColor = (level: string) => {
    switch (level) {
      case "critical": return "var(--risk-critical)";
      case "high": return "var(--risk-high)";
      case "medium": return "var(--risk-medium)";
      default: return "var(--risk-low)";
    }
  };

  const macroLabel = (stance: string) => {
    switch (stance) {
      case "risk_on": return "Risk On";
      case "risk_off": return "Risk Off";
      default: return "Neutral";
    }
  };

  if (isLoading) return <div className="loading">加载系统概览...</div>;
  if (error) return <div className="error">概览服务不可用</div>;
  if (!data) return null;

  return (
    <section className="overview">
      <h2 className="overview__title">EvoOracle 全局风险概览</h2>

      <div className="overview__hero">
        <div className="overview__score-ring" style={{ borderColor: riskColor(data.system_risk_level) }}>
          <span className="overview__score-value">{data.system_risk_score}</span>
          <span className="overview__score-label">系统风险</span>
        </div>
        <div className="overview__hero-meta">
          <span className="overview__risk-level" style={{ color: riskColor(data.system_risk_level) }}>
            {data.system_risk_level.toUpperCase()}
          </span>
          <span className="overview__macro">宏观: {macroLabel(data.macro_stance)}</span>
          <span className="overview__status">
            数据源: <span style={{ color: data.data_source_status === "online" ? "var(--risk-low)" : "var(--risk-high)" }}>
              {data.data_source_status === "online" ? "在线" : "离线"}
            </span>
          </span>
        </div>
      </div>

      <div className="overview__cards">
        <div className="overview__card">
          <span className="overview__card-label">VaR (95%)</span>
          <span className="overview__card-value">{data.portfolio_var_95}%</span>
        </div>
        <div className="overview__card">
          <span className="overview__card-label">年化波动率</span>
          <span className="overview__card-value">{data.annualized_volatility}%</span>
        </div>
        <div className="overview__card">
          <span className="overview__card-label">高风险资产</span>
          <span className="overview__card-value" style={{ color: data.high_risk_asset_count > 0 ? "var(--risk-high)" : "var(--risk-low)" }}>
            {data.high_risk_asset_count} / {data.total_tracked_assets}
          </span>
        </div>
        <div className="overview__card">
          <span className="overview__card-label">活跃告警</span>
          <span className="overview__card-value" style={{ color: data.active_alerts > 3 ? "var(--risk-high)" : "var(--text-primary)" }}>
            {data.active_alerts}
          </span>
        </div>
      </div>
    </section>
  );
}