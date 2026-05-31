import { useState, useEffect } from "react";

interface Rule {
  id: string;
  name: string;
  symbol: string;
  metric: string;
  operator: string;
  threshold: number;
  enabled: number;
}

interface Triggered {
  rule_id: string;
  rule_name: string;
  symbol: string;
  metric: string;
  current_value: number;
  threshold: number;
  operator: string;
}

export function AlertRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [triggered, setTriggered] = useState<Triggered[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("风险分告警");
  const [symbol, setSymbol] = useState("SUI");
  const [metric, setMetric] = useState("risk_score");
  const [operator, setOperator] = useState(">");
  const [threshold, setThreshold] = useState(70);

  const fetchRules = () => {
    fetch("/api/alert-rules")
      .then((r) => r.json())
      .then((d) => setRules(d.rules || []))
      .catch(() => {});
  };

  const fetchTriggered = () => {
    fetch("/api/alert-rules/evaluate")
      .then((r) => r.json())
      .then((d) => setTriggered(d.triggered || []))
      .catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/alert-rules").then((r) => r.json()),
      fetch("/api/alert-rules/evaluate").then((r) => r.json()),
    ])
      .then(([rulesData, trigData]) => {
        setRules(rulesData.rules || []);
        setTriggered(trigData.triggered || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const createRule = () => {
    fetch(`/api/alert-rules/create?name=${encodeURIComponent(name)}&symbol=${symbol}&metric=${metric}&operator=${encodeURIComponent(operator)}&threshold=${threshold}`)
      .then((r) => r.json())
      .then(() => { fetchRules(); fetchTriggered(); })
      .catch(() => {});
  };

  const deleteRule = (id: string) => {
    fetch(`/api/alert-rules/delete/${id}`)
      .then(() => { fetchRules(); fetchTriggered(); })
      .catch(() => {});
  };

  if (loading) return <div className="glass-card p-8 text-center text-text-secondary animate-fade-in">加载中...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold">
        自定义<span className="gradient-text">告警</span>规则
      </h2>

      {/* Triggered alerts */}
      {triggered.length > 0 && (
        <div className="glass-card p-4 border border-risk-critical/30 glow-border">
          <h3 className="font-bold text-risk-critical mb-3">触发中的告警 ({triggered.length})</h3>
          <div className="space-y-2">
            {triggered.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-risk-critical/10">
                <div>
                  <span className="font-bold text-sm">{t.rule_name}</span>
                  <span className="text-text-secondary text-xs ml-2">
                    {t.symbol} {t.metric} = {typeof t.current_value === "number" ? t.current_value.toFixed(1) : t.current_value} {t.operator} {t.threshold}
                  </span>
                </div>
                <span className="text-risk-critical text-xs font-bold">TRIGGERED</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create rule */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4">创建新规则</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
          <div>
            <label className="text-text-secondary text-xs block mb-1">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded bg-bg-card border border-border text-text-primary text-sm"
            />
          </div>
          <div>
            <label className="text-text-secondary text-xs block mb-1">资产</label>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-3 py-2 rounded bg-bg-card border border-border text-text-primary text-sm">
              <option value="SUI">SUI</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
            </select>
          </div>
          <div>
            <label className="text-text-secondary text-xs block mb-1">指标</label>
            <select value={metric} onChange={(e) => setMetric(e.target.value)}
              className="w-full px-3 py-2 rounded bg-bg-card border border-border text-text-primary text-sm">
              <option value="risk_score">风险分</option>
              <option value="volatility">波动率</option>
              <option value="funding_anomaly">资金费率</option>
            </select>
          </div>
          <div>
            <label className="text-text-secondary text-xs block mb-1">条件</label>
            <select value={operator} onChange={(e) => setOperator(e.target.value)}
              className="w-full px-3 py-2 rounded bg-bg-card border border-border text-text-primary text-sm">
              <option value=">">&gt;</option>
              <option value="<">&lt;</option>
              <option value=">=">&gt;=</option>
              <option value="<=">&lt;=</option>
            </select>
          </div>
          <div>
            <label className="text-text-secondary text-xs block mb-1">阈值</label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full px-3 py-2 rounded bg-bg-card border border-border text-text-primary text-sm"
            />
          </div>
          <button onClick={createRule} className="gradient-btn px-4 py-2 rounded-lg text-sm cursor-pointer">
            创建
          </button>
        </div>
      </div>

      {/* Rules list */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4">已有规则 ({rules.length})</h3>
        {rules.length === 0 ? (
          <p className="text-text-secondary text-sm">暂无规则，请创建第一条告警规则。</p>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg bg-bg-card/50 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${rule.enabled ? "bg-risk-low" : "bg-text-secondary"}`} />
                  <span className="font-bold text-sm">{rule.name}</span>
                  <span className="text-text-secondary text-xs">
                    {rule.symbol} · {rule.metric} {rule.operator} {rule.threshold}
                  </span>
                </div>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="text-text-secondary hover:text-risk-critical text-xs cursor-pointer transition-colors"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
