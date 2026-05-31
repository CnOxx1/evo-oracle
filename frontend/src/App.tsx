import { useState, useEffect } from "react";
import { AuthProvider } from "./modules/auth/AuthProvider";
import { LoginButton } from "./modules/auth/LoginButton";
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

type Tab = "oracle" | "risk" | "alerts" | "contagion" | "liquidation" | "whale" | "vault" | "backtest" | "stress" | "predictive" | "protocol" | "rebalancer";

const TABS: { key: Tab; label: string }[] = [
  { key: "oracle", label: "Oracle" },
  { key: "risk", label: "风险分解" },
  { key: "contagion", label: "传导图" },
  { key: "liquidation", label: "清算保护" },
  { key: "whale", label: "鲸鱼信号" },
  { key: "stress", label: "压力测试" },
  { key: "predictive", label: "清算预测" },
  { key: "protocol", label: "多协议" },
  { key: "rebalancer", label: "调仓演示" },
  { key: "alerts", label: "告警" },
  { key: "vault", label: "Vault" },
  { key: "backtest", label: "回测" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("oracle");
  const [selectedSymbol, setSelectedSymbol] = useState("SUI");

  useEffect(() => {
    if (window.location.hash.includes("id_token")) {
      // AuthProvider 内部会处理
    }
  }, []);

  return (
    <AuthProvider>
      <header className="app-header">
        <h1 className="app-title">EvoOracle</h1>
        <nav className="app-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab-btn ${tab === t.key ? "tab-btn--active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <LoginButton />
      </header>

      <main className="app-main">
        {tab === "oracle" && <OracleDashboard onSelectSymbol={(s) => { setSelectedSymbol(s); setTab("risk"); }} />}
        {tab === "risk" && <RiskBreakdown symbol={selectedSymbol} />}
        {tab === "contagion" && <ContagionMap />}
        {tab === "liquidation" && <LiquidationShield />}
        {tab === "whale" && <WhaleSignal />}
        {tab === "stress" && <StressTest />}
        {tab === "predictive" && <PredictiveLiq />}
        {tab === "protocol" && <ProtocolAgg />}
        {tab === "rebalancer" && <RebalancerDemo />}
        {tab === "alerts" && <AlertFeed />}
        {tab === "vault" && <VaultUI />}
        {tab === "backtest" && <BacktestView />}
      </main>
    </AuthProvider>
  );
}
