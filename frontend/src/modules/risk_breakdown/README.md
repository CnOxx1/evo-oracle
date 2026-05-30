# risk_breakdown 模块

可解释风险评分可视化。展示综合风险分**为什么是这个值**——把 5 条证据链的贡献用堆叠条/雷达图拆开。这是技术差异化的视觉表达。

## 展示内容

- 综合风险分大数字（按等级着色）
- 证据链贡献堆叠条：volatility / macro / trend / funding / sentiment 各占多少
- Top Drivers 标签：当前风险的主要驱动因素
- 每条链的 detail 文案（如"年化波动率 0.91"）

## 数据来源

- `api.getRiskBreakdown(symbol)` → 后端 `GET /api/risk-breakdown/{symbol}`

## 组件计划

| 组件 | 说明 |
| --- | --- |
| `RiskBreakdown.tsx` | 模块容器 |
| `ContributionBar.tsx` | 证据链贡献堆叠条 |
| `DriverTags.tsx` | Top Drivers 标签 |

## 视觉目标

让评委一眼看出："这个 Oracle 不是黑盒，它能告诉你风险来自哪里。"

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 定义模块职责与数据来源，对接后端 risk-breakdown 接口 |
