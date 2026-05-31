/** 链上整数解码 + 风险颜色映射工具 */

/** 链上 risk_score 为 0-10000 整数，转为 0-100 浮点 */
export function decodeRiskScore(raw: number): number {
  return raw / 100;
}

/** 风险等级 → CSS 变量名 */
export function riskColor(level: string): string {
  switch (level) {
    case "low":
      return "var(--risk-low)";
    case "medium":
      return "var(--risk-medium)";
    case "high":
      return "var(--risk-high)";
    case "critical":
      return "var(--risk-critical)";
    default:
      return "var(--text-secondary)";
  }
}

/** 风险分数 → 等级 */
export function scoreToLevel(score: number): string {
  if (score < 30) return "low";
  if (score < 60) return "medium";
  if (score < 80) return "high";
  return "critical";
}

/** 格式化百分比 */
export function fmtPct(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toFixed(1)}%`;
}

/** 格式化时间戳 */
export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
