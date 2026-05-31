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

const FEATURES = [
  "压力测试模拟器",
  "4h 清算概率预测",
  "跨资产传导图",
  "一信号三协议联动",
  "实时调仓动画",
  "LUNA 崩盘回测",
];

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

  const riskTextClass = (level: string) => {
    switch (level) {
      case "critical": return "text-risk-critical";
      case "high": return "text-risk-high";
      case "medium": return "text-risk-medium";
      default: return "text-risk-low";
    }
  };

  const riskBorderClass = (level: string) => {
    switch (level) {
      case "critical": return "border-risk-critical";
      case "high": return "border-risk-high";
      case "medium": return "border-risk-medium";
      default: return "border-risk-low";
    }
  };

  const macroLabel = (stance: string) => {
    switch (stance) {
      case "risk_on": return "Risk On";
      case "risk_off": return "Risk Off";
      default: return "Neutral";
    }
  };

  if (isLoading) return <div className="text-text-secondary animate-pulse p-8 text-center">加载系统概览...</div>;
  if (error) return <div className="text-risk-high p-8 text-center">概览服务不可用</div>;
  if (!data) return null;

  return (
    <section className="animate-fade-in space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold gradient-text mb-2">EvoOracle 全局风险概览</h2>
      </div>

      <div className="glass-card p-6">
        <p className="text-text-secondary leading-relaxed">
          <strong className="text-text-primary">EvoOracle</strong> 是 Sui 上的风险预言机 ——
          价格预言机告诉你"现在多少钱"，EvoOracle 告诉你<strong className="text-accent">"现在有多危险"</strong>。
          一个信号，同时保护借贷、永续、金库三类协议。
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="w-2 h-2 rounded-full bg-accent pulse-glow" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative flex-shrink-0">
          <div
            className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center glow-border ${riskBorderClass(data.system_risk_level)}`}
          >
            <span className="text-4xl font-bold text-text-primary">{data.system_risk_score}</span>
            <span className="text-xs text-text-secondary mt-1">系统风险</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className={`text-2xl font-bold ${riskTextClass(data.system_risk_level)}`}>
            {data.system_risk_level.toUpperCase()}
          </span>
          <span className="text-text-secondary">宏观: {macroLabel(data.macro_stance)}</span>
          <span className="text-text-secondary">
            数据源:{" "}
            <span className={data.data_source_status === "online" ? "text-risk-low" : "text-risk-high"}>
              {data.data_source_status === "online" ? "在线" : "离线"}
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 text-center">
          <span className="text-xs text-text-secondary block mb-1">VaR (95%)</span>
          <span className="text-2xl font-bold text-text-primary">{data.portfolio_var_95}%</span>
        </div>
        <div className="glass-card p-5 text-center">
          <span className="text-xs text-text-secondary block mb-1">年化波动率</span>
          <span className="text-2xl font-bold text-text-primary">{data.annualized_volatility}%</span>
        </div>
        <div className="glass-card p-5 text-center">
          <span className="text-xs text-text-secondary block mb-1">高风险资产</span>
          <span className={`text-2xl font-bold ${data.high_risk_asset_count > 0 ? "text-risk-high" : "text-risk-low"}`}>
            {data.high_risk_asset_count} / {data.total_tracked_assets}
          </span>
        </div>
        <div className="glass-card p-5 text-center">
          <span className="text-xs text-text-secondary block mb-1">活跃告警</span>
          <span className={`text-2xl font-bold ${data.active_alerts > 3 ? "text-risk-high" : "text-text-primary"}`}>
            {data.active_alerts}
          </span>
        </div>
      </div>
    </section>
  );
}
