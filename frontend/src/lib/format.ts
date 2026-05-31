/** 链上整数解码 + 风险颜色映射工具 */

/** 链上 risk_score 为 0-10000 整数，转为 0-100 浮点 */
export function decodeRiskScore(raw: number): number {
  return raw / 100;
}

/** 风险等级 → CSS 变量名 (legacy, kept for chart fills) */
export function riskColor(level: string): string {
  switch (level) {
    case "low":
      return "var(--color-risk-low)";
    case "medium":
      return "var(--color-risk-medium)";
    case "high":
      return "var(--color-risk-high)";
    case "critical":
      return "var(--color-risk-critical)";
    default:
      return "var(--color-text-secondary)";
  }
}

/** 风险等级 → Tailwind text color class */
export function riskTextClass(level: string): string {
  switch (level) {
    case "low":
      return "text-risk-low";
    case "medium":
      return "text-risk-medium";
    case "high":
      return "text-risk-high";
    case "critical":
      return "text-risk-critical";
    default:
      return "text-text-secondary";
  }
}

/** 风险等级 → Tailwind bg color class */
export function riskBgClass(level: string): string {
  switch (level) {
    case "low":
      return "bg-risk-low";
    case "medium":
      return "bg-risk-medium";
    case "high":
      return "bg-risk-high";
    case "critical":
      return "bg-risk-critical";
    default:
      return "bg-text-secondary";
  }
}

/** 风险等级 → Tailwind border-l color class */
export function riskBorderLClass(level: string): string {
  switch (level) {
    case "low":
      return "border-l-risk-low";
    case "medium":
      return "border-l-risk-medium";
    case "high":
      return "border-l-risk-high";
    case "critical":
      return "border-l-risk-critical";
    default:
      return "border-l-text-secondary";
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
