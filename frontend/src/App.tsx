import { useState, useEffect } from "react";
import { AuthProvider } from "./modules/auth/AuthProvider";
import { LoginButton } from "./modules/auth/LoginButton";
import { LandingPage } from "./modules/landing/LandingPage";
import { Overview } from "./modules/overview/Overview";
import { OracleDashboard } from "./modules/oracle_dashboard/OracleDashboard";
import { RiskBreakdown } from "./modules/risk_breakdown/RiskBreakdown";
import { AlertFeed } from "./modules/alert_feed/AlertFeed";
import { VaultUI } from "./modules/vault_ui/VaultUI";
import { BacktestView } from "./modules/backtest_view/BacktestView";
import { ContagionMap } from "./modules/contagion_map/ContagionMap";
import { LiquidationShield } from "./modules/liquidation_shield/LiquidationShield";
import { WhaleSignal } from "./modules/whale_signal/WhaleSignal";
import { StressTest } from "./modules/stress_test/StressTest";
import { PredictiveLiq } from "./modules/predictive_liq/PredictiveLiq";
import { ProtocolAgg } from "./modules/protocol_agg/ProtocolAgg";
import { RebalancerDemo } from "./modules/rebalancer_demo/RebalancerDemo";
import { RiskHistory } from "./modules/history/RiskHistory";
import { CascadeSimulator } from "./modules/cascade/CascadeSimulator";
import { Portfolio } from "./modules/portfolio/Portfolio";
import { AlertRules } from "./modules/alert_rules/AlertRules";
import { ProtocolCompare } from "./modules/protocol_compare/ProtocolCompare";
import { MacroRegime } from "./modules/macro_regime/MacroRegime";
import { LiqHeatmap } from "./modules/liq_heatmap/LiqHeatmap";
import { VaultAttribution } from "./modules/vault_attribution/VaultAttribution";

type Tab = "overview" | "oracle" | "risk" | "alerts" | "contagion" | "liquidation" | "whale" | "vault" | "backtest" | "stress" | "predictive" | "protocol" | "rebalancer" | "history" | "cascade" | "portfolio" | "alert_rules" | "proto_compare" | "macro" | "liq_heatmap" | "vault_attr";

interface TabGroup {
  key: string;
  label: string;
  tabs: { key: Tab; label: string }[];
}

const TAB_GROUPS: TabGroup[] = [
  { key: "overview", label: "总览", tabs: [
    { key: "overview", label: "概览" },
    { key: "portfolio", label: "Portfolio" },
    { key: "history", label: "趋势" },
  ]},
  { key: "oracle", label: "Oracle", tabs: [
    { key: "oracle", label: "Oracle" },
    { key: "risk", label: "风险分解" },
    { key: "macro", label: "宏观状态" },
  ]},
  { key: "liquidation", label: "清算", tabs: [
    { key: "liquidation", label: "清算保护" },
    { key: "cascade", label: "清算瀑布" },
    { key: "liq_heatmap", label: "清算热图" },
    { key: "predictive", label: "清算预测" },
  ]},
  { key: "market", label: "市场", tabs: [
    { key: "contagion", label: "传导图" },
    { key: "whale", label: "鲸鱼信号" },
    { key: "stress", label: "压力测试" },
  ]},
  { key: "protocol", label: "协议", tabs: [
    { key: "protocol", label: "多协议" },
    { key: "proto_compare", label: "协议排名" },
    { key: "rebalancer", label: "调仓演示" },
    { key: "vault", label: "Vault" },
    { key: "vault_attr", label: "收益归因" },
  ]},
  { key: "alerts", label: "告警", tabs: [
    { key: "alert_rules", label: "告警规则" },
    { key: "alerts", label: "告警流" },
    { key: "backtest", label: "回测" },
  ]},
];

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [activeGroup, setActiveGroup] = useState("overview");
  const [selectedSymbol, setSelectedSymbol] = useState("SUI");

  const currentGroup = TAB_GROUPS.find((g) => g.key === activeGroup)!;

  useEffect(() => {
    if (window.location.hash.includes("id_token")) {
      // AuthProvider 内部会处理
    }
  }, []);

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <AuthProvider>
      <header className="glass sticky top-0 z-50 rounded-xl px-6 py-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-xl font-bold gradient-text whitespace-nowrap mr-auto">
            EvoOracle
          </h1>
          <nav className="flex gap-2">
            {TAB_GROUPS.map((g) => (
              <button
                key={g.key}
                onClick={() => { setActiveGroup(g.key); setTab(g.tabs[0].key); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer
                  ${activeGroup === g.key
                    ? "bg-accent/20 text-text-primary font-semibold shadow-[0_0_12px_rgba(108,99,255,0.3)]"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-card/50"
                  }`}
              >
                {g.label}
              </button>
            ))}
          </nav>
          <LoginButton />
        </div>
        <div className="flex gap-1 mt-3 pt-3 border-t border-white/5">
          {currentGroup.tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1 rounded-md text-xs whitespace-nowrap transition-all duration-200 cursor-pointer
                ${tab === t.key
                  ? "bg-accent/15 text-text-primary font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card/40"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="animate-fade-in">
        {tab === "overview" && <Overview />}
        {tab === "portfolio" && <Portfolio />}
        {tab === "history" && <RiskHistory />}
        {tab === "oracle" && <OracleDashboard onSelectSymbol={(s) => { setSelectedSymbol(s); setTab("risk"); }} />}
        {tab === "risk" && <RiskBreakdown symbol={selectedSymbol} />}
        {tab === "contagion" && <ContagionMap />}
        {tab === "liquidation" && <LiquidationShield />}
        {tab === "cascade" && <CascadeSimulator />}
        {tab === "liq_heatmap" && <LiqHeatmap />}
        {tab === "whale" && <WhaleSignal />}
        {tab === "stress" && <StressTest />}
        {tab === "predictive" && <PredictiveLiq />}
        {tab === "macro" && <MacroRegime />}
        {tab === "protocol" && <ProtocolAgg />}
        {tab === "proto_compare" && <ProtocolCompare />}
        {tab === "rebalancer" && <RebalancerDemo />}
        {tab === "alert_rules" && <AlertRules />}
        {tab === "alerts" && <AlertFeed />}
        {tab === "vault" && <VaultUI />}
        {tab === "vault_attr" && <VaultAttribution />}
        {tab === "backtest" && <BacktestView />}
      </main>
    </AuthProvider>
  );
}
