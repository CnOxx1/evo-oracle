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

  if (isLoading) return <div className="loading">加载协议数据...</div>;
  if (error) return <div className="error">协议聚合服务不可用</div>;

  const lending = data?.categories.find((c) => c.protocol_type === "lending");
  const perp = data?.categories.find((c) => c.protocol_type === "perp");
  const vault = data?.categories.find((c) => c.protocol_type === "vault");

  return (
    <section className="protocol-agg">
      <h2 className="protocol-agg__title">多协议联动展示</h2>

      <div className="protocol-agg__controls">
        <label className="protocol-agg__label">
          资产
          <select
            className="protocol-agg__select"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="protocol-agg__grid">
        <ProtocolCard title="Lending" category={lending} />
        <ProtocolCard title="Perp" category={perp} />
        <ProtocolCard title="Vault" category={vault} />
      </div>

      {data?.protection_summary && (
        <div className="protocol-agg__summary">
          <span className="protocol-agg__summary-score">
            保护效果评分: {data.protection_summary.total_improvement_score}/100
          </span>
          <p className="protocol-agg__summary-desc">
            {data.protection_summary.description}
          </p>
        </div>
      )}
    </section>
  );
}

function ProtocolCard({
  title,
  category,
}: {
  title: string;
  category: ProtocolCategory | undefined;
}) {
  if (!category) {
    return (
      <div className="protocol-agg__card">
        <h3 className="protocol-agg__card-title">{title}</h3>
        <p className="protocol-agg__card-empty">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="protocol-agg__card">
      <h3 className="protocol-agg__card-title">
        {title} <span className="protocol-agg__card-name">{category.protocol_name}</span>
      </h3>
      <table className="protocol-agg__table">
        <thead>
          <tr>
            <th>参数</th>
            <th style={{ color: "var(--risk-low)" }}>有 Oracle</th>
            <th style={{ color: "var(--risk-high)" }}>无 Oracle</th>
            <th>提升</th>
          </tr>
        </thead>
        <tbody>
          {category.params.map((p) => (
            <tr key={p.parameter}>
              <td>{p.parameter}</td>
              <td style={{ color: "var(--risk-low)" }}>{p.with_oracle}</td>
              <td style={{ color: "var(--risk-high)" }}>{p.without_oracle}</td>
              <td style={{ color: "var(--accent)" }}>{p.improvement}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
