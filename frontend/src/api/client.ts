/** 后端 API 封装 + TypeScript 类型定义 */

const BASE = import.meta.env.VITE_API_BASE_URL || "";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────

export interface OracleAsset {
  symbol: string;
  risk_score: number;
  risk_level: string;
  trend_signal: string;
  volatility: number;
  funding_anomaly: boolean;
  macro_stance: string;
  generated_at: string;
  onchain_payload: Record<string, unknown>;
}

export interface OracleAllResponse {
  symbol_count: number;
  oracles: Record<string, OracleAsset | { error: string }>;
}

export interface RiskContribution {
  source: string;
  weight: number;
  score: number;
  contribution: number;
  drivers: string[];
}

export interface RiskBreakdownResponse {
  symbol: string;
  composite_score: number;
  risk_level: string;
  contributions: RiskContribution[];
  top_drivers?: string[];
}

export interface Alert {
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  symbol?: string;
  timestamp?: string;
}

export interface AlertsResponse {
  alert_count: number;
  alerts: Alert[];
}

export interface VaultState {
  status: string;
  protected: { sui_pct: number | null; usdc_pct: number | null; pnl_7d: number | null };
  static: { sui_pct: number; usdc_pct: number; pnl_7d: number | null };
}

export interface BacktestPoint {
  date: string;
  price: number;
  risk_score: number;
  event: string | null;
  protected_pnl: number;
  static_pnl: number;
  exposure: number;
  action: string;
}

export interface BacktestParams {
  exit_threshold: number;
  reduce_threshold: number;
  initial_exposure: number;
}

export interface BacktestSummary {
  protected_final: number;
  static_final: number;
  max_drawdown_avoided: number;
  actions_taken: number;
  max_drawdown_protected: number;
  max_drawdown_static: number;
}

export interface BacktestLunaResponse {
  window: { start: string; end: string };
  parameters: BacktestParams;
  series: BacktestPoint[];
  summary: BacktestSummary;
}

// ─── Contagion Map Types ─────────────────────────────────────

export interface ContagionNode {
  symbol: string;
  full_symbol: string;
  sector: string;
  rs_rank: number;
  rs_momentum: string;
  risk_contribution: number;
  price_change_7d: number;
}

export interface ContagionEdge {
  source: string;
  target: string;
  correlation: number;
  risk_type: "contagion" | "hedge";
  strength: "strong" | "moderate";
}

export interface ContagionCluster {
  sector: string;
  phase: string;
  momentum_score: number;
  return_7d: number;
  volatility_7d: number;
  avg_intra_correlation: number;
  contagion_risk: string;
  contagion_score: number;
  asset_count: number;
}

export interface SystemRisk {
  level: string;
  score: number;
  description: string;
  avg_correlation: number;
  max_correlation: number;
  portfolio_volatility: number;
  diversification_ratio: number;
  daily_var_95: number;
}

export interface ContagionMapResponse {
  nodes: ContagionNode[];
  edges: ContagionEdge[];
  clusters: ContagionCluster[];
  system_risk: SystemRisk;
  meta: { total_assets: number; high_corr_links: number; hedge_links: number };
}

// ─── Liquidation Shield Types ────────────────────────────────

export interface LiquidationAsset {
  symbol: string;
  funding_rate: number;
  annualized_rate: number;
  is_elevated: boolean;
  liquidation_risk_score: number;
  risk_level: string;
  cascade_multiplier: number;
}

export interface LiquidationShieldResponse {
  shield_status: "active" | "warning" | "safe";
  shield_action: string;
  cascade_risk: { score: number; level: string; high_risk_assets: number; avg_risk_score: number };
  portfolio_context: { daily_var_95: number; daily_var_99: number; annualized_volatility: number; avg_correlation: number };
  assets: LiquidationAsset[];
}

// ─── Whale Signal Types ──────────────────────────────────────

export interface WhaleSignal {
  symbol: string;
  whale_action: string;
  direction: string;
  signal_strength: number;
  rs_momentum: string;
  rs_7d: number;
  rs_1d: number;
  funding_bias: string;
  funding_rate: number;
  price_change_7d: number;
}

export interface WhaleSignalsResponse {
  market_whale_bias: string;
  risk_implication: string;
  active_whale_count: number;
  total_assets: number;
  accumulating_count: number;
  distributing_count: number;
  signals: WhaleSignal[];
  top_accumulating: WhaleSignal[];
  top_distributing: WhaleSignal[];
}

// ─── API Functions ───────────────────────────────────────────

/** 将后端 risk-breakdown 响应标准化为前端期望的结构 */
function normalizeBreakdown(raw: Record<string, unknown>): RiskBreakdownResponse {
  // 后端可能返回 composite_risk_score 或 composite_score
  const score = (raw.composite_score ?? raw.composite_risk_score ?? 0) as number;
  // 后端可能返回 contributions 或 breakdown
  const items = (raw.contributions ?? raw.breakdown ?? []) as Record<string, unknown>[];
  const topDrivers = (raw.top_drivers ?? []) as string[];

  const contributions: RiskContribution[] = items.map((item) => ({
    source: (item.source ?? item.factor ?? "") as string,
    weight: (item.weight ?? 0) as number,
    score: (item.score ?? item.sub_score ?? 0) as number,
    contribution: (item.contribution ?? 0) as number,
    drivers: (item.drivers ?? (item.detail ? [item.detail as string] : [])) as string[],
  }));

  return {
    symbol: raw.symbol as string,
    composite_score: score,
    risk_level: raw.risk_level as string,
    contributions,
    top_drivers: topDrivers,
  };
}

export const api = {
  health: () => get<{ evo_oracle: string }>("/api/health"),
  oracleAll: () => get<OracleAllResponse>("/api/oracle"),
  oracle: (symbol: string) => get<OracleAsset>(`/api/oracle/${symbol}`),
  riskBreakdown: (symbol: string) =>
    get<Record<string, unknown>>(`/api/risk-breakdown/${symbol}`).then(normalizeBreakdown),
  alerts: () => get<AlertsResponse>("/api/alerts"),
  alertsSymbol: (symbol: string) => get<AlertsResponse>(`/api/alerts/${symbol}`),
  vaultState: () => get<VaultState>("/api/vault/state"),
  backtestLuna: (params?: Partial<BacktestParams>) => {
    const qs = params
      ? "?" + new URLSearchParams(
          Object.entries(params).map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return get<BacktestLunaResponse>(`/api/backtest/luna${qs}`);
  },
  contagionMap: () => get<ContagionMapResponse>("/api/contagion-map"),
  liquidationShield: () => get<LiquidationShieldResponse>("/api/liquidation-shield"),
  whaleSignals: () => get<WhaleSignalsResponse>("/api/whale-signals"),
};
