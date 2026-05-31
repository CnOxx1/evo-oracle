import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface ProtocolParam {
  parameter: string;
  with_oracle: string | number;
  without_oracle: string | number;
  improvement: string;
}

interface ProtocolCategory {
  protocol_type: string;
  protocol_name: string;
  params: ProtocolParam[];
}

interface ProtocolAggResponse {
  symbol: string;
  categories: ProtocolCategory[];
  protection_summary: {
    total_improvement_score: number;
    description: string;
  };
}

const SYMBOLS = ["SUI", "BTC", "ETH", "SOL", "ARB"];

const PROTOCOL_ICONS: Record<string, string> = {
  lending: "🏦",
  perp: "📈",
  vault: "🔐",
};

const PROTOCOL_COLORS: Record<string, string> = {
  lending: "from-blue-500 to-cyan-400",
  perp: "from-purple-500 to-pink-400",
  vault: "from-emerald-500 to-teal-400",
};

export function ProtocolAgg() {
  const [symbol, setSymbol] = useState("SUI");

  const { data, isLoading, error } = useQuery<ProtocolAggResponse>({
    queryKey: ["protocol-aggregation", symbol],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || ""}/api/protocol-aggregation?symbol=${symbol}`
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
  });

  if (isLoading) return <div className="text-center py-12 text-text-secondary animate-pulse">加载协议数据...</div>;
  if (error) return <div className="text-center py-12 text-risk-high">协议聚合服务不可用</div>;

  const lending = data?.categories.find((c) => c.protocol_type.startsWith("lending"));
  const perp = data?.categories.find((c) => c.protocol_type.startsWith("perp") || c.protocol_type.startsWith("perpetual"));
  const vault = data?.categories.find((c) => c.protocol_type.startsWith("vault"));
  const score = data?.protection_summary?.total_improvement_score ?? 0;

  return (
    <section className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold gradient-text">一信号 → 三协议联动</h2>
          <p className="text-text-secondary text-sm mt-1">EvoOracle 风险信号如何同时保护 Lending / Perp / Vault</p>
        </div>
        <div className="flex items-center gap-2">
          {SYMBOLS.map((s) => (
            <button
              key={s}
              onClick={() => setSymbol(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                symbol === s
                  ? "gradient-btn shadow-[0_0_12px_rgba(108,99,255,0.4)]"
                  : "bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-card"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Signal Flow Diagram */}
      <div className="glass-card p-6">
        <div className="flex flex-col items-center gap-4">
          {/* Oracle Signal Source */}
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-accent/20 to-accent-blue/20 border border-accent/30">
            <div className="w-3 h-3 rounded-full bg-accent pulse-glow" />
            <span className="font-semibold text-text-primary">EvoOracle 风险信号</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">{symbol}</span>
          </div>

          {/* Arrow Down */}
          <div className="flex flex-col items-center">
            <div className="w-px h-6 bg-gradient-to-b from-accent to-accent/30" />
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-accent/50" />
          </div>

          {/* Three Protocol Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <ProtocolCard title="Lending" type="lending" category={lending} />
            <ProtocolCard title="Perp" type="perp" category={perp} />
            <ProtocolCard title="Vault" type="vault" category={vault} />
          </div>
        </div>
      </div>

      {/* Protection Summary */}
      {data?.protection_summary && (
        <div className="glass-card p-6 border-t-2 border-accent/40">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-shrink-0">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--color-bg-secondary)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="3"
                    strokeDasharray={`${score}, 100`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-accent">{score}</span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary mb-1">保护效果综合评分</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {data.protection_summary.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ProtocolCard({
  title,
  type,
  category,
}: {
  title: string;
  type: string;
  category: ProtocolCategory | undefined;
}) {
  const icon = PROTOCOL_ICONS[type] ?? "📋";
  const gradient = PROTOCOL_COLORS[type] ?? "from-accent to-accent-blue";

  if (!category) {
    return (
      <div className="glass-card p-5 opacity-50">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{icon}</span>
          <h3 className="font-semibold text-text-primary">{title}</h3>
        </div>
        <p className="text-sm text-text-secondary">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 hover:border-accent/30 transition-all duration-300 group">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <h3 className="font-semibold text-text-primary">{title}</h3>
      </div>
      <p className="text-xs text-text-secondary mb-4">{category.protocol_name}</p>

      <div className="space-y-3">
        {category.params.map((p) => (
          <div key={p.parameter} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">{p.parameter}</span>
              <span className={`text-xs font-semibold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                {p.improvement}
              </span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="flex-1 px-2 py-1 rounded bg-risk-low/10 text-risk-low text-center border border-risk-low/20">
                {p.with_oracle}
              </span>
              <span className="flex-1 px-2 py-1 rounded bg-risk-high/10 text-risk-high text-center border border-risk-high/20 line-through opacity-60">
                {p.without_oracle}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom gradient bar */}
      <div className={`mt-4 h-0.5 rounded-full bg-gradient-to-r ${gradient} opacity-40 group-hover:opacity-100 transition-opacity`} />
    </div>
  );
}
