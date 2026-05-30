# alert_feed 模块

实时异常告警流。展示后端 `alert_engine` 检测到的风险事件，按严重度排序滚动。

## 展示内容

- 告警流列表，每条含：
  - 严重度标记（🔴 critical / 🟡 warning / 🔵 info）
  - 资产符号
  - 告警类型与文案
  - 触发值与时间
- 顶部统计：critical / warning / info 各几条
- 可选：订阅链上 `alert::RiskAlert` event，展示「链上实时推送」

## 数据来源

- `api.getAllAlerts()` → 后端 `GET /api/alerts`
- 单资产：`api.getAlerts(symbol)` → `GET /api/alerts/{symbol}`
- 进阶：`lib/suiClient` 订阅链上 event

## 组件计划

| 组件 | 说明 |
| --- | --- |
| `AlertFeed.tsx` | 模块容器，轮询/订阅刷新 |
| `AlertItem.tsx` | 单条告警 |
| `SeverityBadge.tsx` | 严重度标记 |

## 视觉目标

体现「安全监控」气质——像一个实时风控大屏，红色告警出现时一目了然。

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 定义模块职责与数据来源，对接后端 alerts 接口 |
