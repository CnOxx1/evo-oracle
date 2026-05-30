# server 模块

给前端提供聚合后的只读 REST API。前后端分离的后端出口——前端只与本服务（和 Sui 链）交互，不直接访问 EvoQuantV3。

## 功能

- 聚合 EvoQuantV3 的多个接口，输出前端友好的数据结构
- 轻量内存缓存（默认 30s TTL），降低对数据基座的压力
- CORS 放开，方便前端本地开发

## 接口

| 接口 | 说明 | 对应前端模块 |
| --- | --- | --- |
| `GET /api/health` | EvoOracle 后端 + 数据基座健康 | 全局 |
| `GET /api/oracle/{symbol}` | 单资产链上信号视图（含转换后的 payload） | oracle_dashboard |
| `GET /api/oracle` | 全部 tracked 资产信号摘要 | oracle_dashboard |
| `GET /api/risk-breakdown/{symbol}` | 可解释风险评分（证据链贡献明细） | risk_breakdown |
| `GET /api/alerts/{symbol}` | 单资产异常告警列表 | alert_feed |
| `GET /api/alerts` | 全资产告警流（按严重度排序） | alert_feed |
| `GET /api/vault/state` | Vault 当前仓位 + Protected/Static 对比 | vault_ui |
| `GET /api/backtest/luna` | LUNA 崩盘期间历史回测序列 | backtest_view |

`/api/risk-breakdown` 由 `risk_composer` 提供，`/api/alerts` 由 `alert_engine` 提供。

> 注：`/api/vault/state` 与 `/api/backtest/luna` 在脚手架阶段返回结构化占位数据，
> 待 Vault 合约与回测计算接入后替换为真实数据。

## 运行

```bash
python -m server.app --port 8100
```

启动后：

- Swagger UI: `http://localhost:8100/docs`

## 端口约定

默认 `:8100`，与 EvoQuantV3 的 `:8000` 区分，避免冲突。

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 初始化前端 API 服务，定义 5 个聚合接口（部分占位） |
