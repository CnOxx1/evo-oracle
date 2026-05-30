# lib（前端通用库）

存放 Sui 客户端配置、链上对象读取封装与通用工具。

## 计划内容

| 文件 | 说明 |
| --- | --- |
| `suiClient.ts` | dapp-kit / SuiClient 初始化，网络配置 |
| `oracleReader.ts` | 读取链上 RiskSnapshot 对象 |
| `vaultReader.ts` | 读取链上 Vault 对象 |
| `format.ts` | 链上整数 → 展示值（risk_score/100 等）反解码 |

## 反解码约定（与 backend/signal_processor 对应）

| 链上字段 | 展示值 |
| --- | --- |
| `risk_score` | `value / 100` |
| `annualized_vol` | `value / 10000` |
| `risk_level` | 0→low 1→medium 2→high 3→extreme |
| `trend` | 0→bearish 1→neutral 2→bullish |

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 定义通用库清单与反解码约定（待实现） |
