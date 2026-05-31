import { useState, useEffect } from "react";

interface DataPoint {
  risk_score: number;
  risk_level: string;
  volatility: number;
  macro_stance: string;
  timestamp: number;
}

export function RiskHistory() {
  const [symbol, setSymbol] = useState("SUI");
  const [hours, setHours] = useState(24);
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/history/${symbol}?hours=${hours}`)
      .then((r) => r.json())
      .then((d) => setData(d.history || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [symbol, hours]);

  const maxScore = Math.max(...data.map((d) => d.risk_score), 100);
  const minScore = Math.min(...data.map((d) => d.risk_score), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">
          风险<span className="gradient-text">趋势</span>
        </h2>
        <div className="flex gap-2">
          {["SUI", "BTC", "ETH"].map((s) => (
            <button
              key={s}
              onClick={() => setSymbol(s)}
              className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all ${
                symbol === s
                  ? "bg-accent/20 text-text-primary font-semibold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {s}
            </button>
          ))}
          <span className="text-text-secondary mx-2">|</span>
          {[6, 12, 24, 48].map((h) => (
            <button
              key={h}
              onClick={() => setHours(h)}
              className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all ${
                hours === h
                  ? "bg-accent/20 text-text-primary font-semibold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-text-secondary">加载中...</div>
      ) : (
        <>
          {/* Sparkline Chart */}
          <div className="glass-card p-6 glow-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-text-secondary text-sm">{symbol} 风险分趋势 ({hours}h)</span>
              <span className="text-text-secondary text-sm">
                当前: <span className="text-text-primary font-bold">{data[data.length - 1]?.risk_score ?? "—"}</span>
              </span>
            </div>
            <div className="h-48 relative">
              <svg viewBox={`0 0 ${data.length} 100`} className="w-full h-full" preserveAspectRatio="none">
                {/* Grid lines */}
                <line x1="0" y1="25" x2={data.length} y2="25" stroke="rgba(108,99,255,0.1)" strokeWidth="0.5" />
                <line x1="0" y1="50" x2={data.length} y2="50" stroke="rgba(108,99,255,0.1)" strokeWidth="0.5" />
                <line x1="0" y1="75" x2={data.length} y2="75" stroke="rgba(108,99,255,0.1)" strokeWidth="0.5" />
                {/* Area fill */}
                <path
                  d={`M0,100 ${data.map((d, i) => `L${i},${100 - d.risk_score}`).join(" ")} L${data.length - 1},100 Z`}
                  fill="url(#gradient)"
                  opacity="0.3"
                />
                {/* Line */}
                <path
                  d={data.map((d, i) => `${i === 0 ? "M" : "L"}${i},${100 - d.risk_score}`).join(" ")}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="1.5"
                />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6c63ff" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#6c63ff" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6c63ff" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Y-axis labels */}
              <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-xs text-text-secondary pointer-events-none">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>
            </div>
            {/* Risk zones */}
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-risk-low">低风险 (&lt;35)</span>
              <span className="text-risk-medium">中风险 (35-55)</span>
              <span className="text-risk-high">高风险 (55-75)</span>
              <span className="text-risk-critical">极高 (&gt;75)</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold gradient-text">
                {data.length > 0 ? Math.round(data.reduce((s, d) => s + d.risk_score, 0) / data.length) : "—"}
              </div>
              <div className="text-text-secondary text-xs">平均风险分</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-risk-critical">
                {data.length > 0 ? Math.round(Math.max(...data.map((d) => d.risk_score))) : "—"}
              </div>
              <div className="text-text-secondary text-xs">最高风险分</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-risk-low">
                {data.length > 0 ? Math.round(Math.min(...data.map((d) => d.risk_score))) : "—"}
              </div>
              <div className="text-text-secondary text-xs">最低风险分</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-accent">
                {data.length > 1
                  ? (data[data.length - 1].risk_score - data[0].risk_score > 0 ? "↑" : "↓") +
                    Math.abs(Math.round(data[data.length - 1].risk_score - data[0].risk_score))
                  : "—"}
              </div>
              <div className="text-text-secondary text-xs">变化趋势</div>
            </div>
          </div>

          {/* Data table */}
          <div className="glass-card p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-secondary border-b border-border/50">
                  <th className="text-left py-2">时间</th>
                  <th className="text-right py-2">风险分</th>
                  <th className="text-right py-2">波动率</th>
                  <th className="text-right py-2">宏观状态</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(-10).reverse().map((d, i) => (
                  <tr key={i} className="border-b border-border/20">
                    <td className="py-2 text-text-secondary">
                      {new Date(d.timestamp * 1000).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className={`py-2 text-right font-mono font-bold ${
                      d.risk_score >= 75 ? "text-risk-critical" :
                      d.risk_score >= 55 ? "text-risk-high" :
                      d.risk_score >= 35 ? "text-risk-medium" : "text-risk-low"
                    }`}>
                      {Math.round(d.risk_score)}
                    </td>
                    <td className="py-2 text-right font-mono text-text-secondary">
                      {(d.volatility * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        d.macro_stance === "risk_off" ? "bg-risk-critical/20 text-risk-critical" :
                        d.macro_stance === "risk_on" ? "bg-risk-low/20 text-risk-low" :
                        "bg-accent/20 text-accent"
                      }`}>
                        {d.macro_stance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
