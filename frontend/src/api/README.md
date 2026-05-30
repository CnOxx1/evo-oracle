# api（前端数据层）

封装对 EvoOracle 后端（`http://127.0.0.1:8100`）的所有调用。前端组件只通过这里取后端数据，不散落 fetch。

## 计划接口封装

| 函数 | 对应后端接口 |
| --- | --- |
| `getHealth()` | `GET /api/health` |
| `getOracle(symbol)` | `GET /api/oracle/{symbol}` |
| `getAllOracles()` | `GET /api/oracle` |
| `getVaultState()` | `GET /api/vault/state` |
| `getLunaBacktest()` | `GET /api/backtest/luna` |

## 约定

- 基地址来自环境变量 `VITE_API_BASE`，默认 `http://127.0.0.1:8100`
- 统一错误处理与类型定义（TS interface）

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 定义前端数据层接口清单（待实现） |
