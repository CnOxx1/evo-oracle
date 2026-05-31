# oracle_dashboard 模块

链上信号实时监控面板。展示每个资产从 EvoOracle 读取的风险评分、趋势、资金费率异常、宏观情绪。

## 展示内容

- 资产卡片：SUI / BTC / ETH
  - 趋势标签（bullish / neutral / bearish）
  - 风险评分进度条（0–100，按等级着色）
  - 年化波动率
  - 资金费率异常标记
  - 宏观情绪（risk_on / risk_off）
  - 数据新鲜度（上次更新时间）

## 数据来源

- `api.getAllOracles()` → 后端 `GET /api/oracle`
- 可选：通过 `lib/oracleReader` 直接读链上对象，展示「链上 vs 后端」一致性

## 组件计划

| 组件 | 说明 |
| --- | --- |
| `OracleDashboard.tsx` | 模块容器，轮询刷新 |
| `AssetCard.tsx` | 单资产信号卡片 |
| `RiskBar.tsx` | 风险评分进度条 |

## 视觉目标

一眼看出哪个资产风险高、趋势如何。风险越高卡片越偏红。

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 定义模块职责、数据来源与组件清单（待实现） |
| 2026-05-31 | ✅ 实现 OracleDashboard.tsx、AssetCard.tsx、RiskBar.tsx；接入 React Query 轮询 |
