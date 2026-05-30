# alert 模块（Move）

链上异常告警。把后端 `alert_engine` 检测到的异常作为 Sui **event** 发出，任何协议/前端可订阅。

## 为什么用 event

Sui event 是链上可索引的广播机制。协议无需轮询，订阅 event 即可在风险升高时实时响应——比把告警塞进对象更轻量、更实时。

## 数据结构

### RiskAlert（event）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `symbol` | `String` | 资产符号 |
| `alert_type` | `u8` | 0=funding 1=volatility 2=risk_escalation 3=macro_flip 4=trend 5=sentiment |
| `severity` | `u8` | 0=info 1=warning 2=critical |
| `value` | `u64` | 触发值（定点编码） |
| `timestamp` | `u64` | 发出时间 |

## 函数

| 函数 | 权限 | 说明 |
| --- | --- | --- |
| `emit_alert(cap, symbol, alert_type, severity, value, clock)` | AdminCap | 发出一条告警 event |

权限复用 `oracle::OracleAdminCap`，只有授权 Bridge 能发。

## 消费方式

```move
// 协议在自己的交易里读取 event，或前端用 SuiClient.queryEvents 订阅
// event type: <package>::alert::RiskAlert
```

## 编码对应（与 backend/alert_engine）

| 后端 alert_type | 链上 u8 |
| --- | --- |
| funding_spike | 0 |
| volatility_breakout | 1 |
| risk_escalation | 2 |
| macro_flip | 3 |
| bearish_trend | 4 |
| negative_sentiment | 5 |

| 后端 severity | 链上 u8 |
| --- | --- |
| info | 0 |
| warning | 1 |
| critical | 2 |

## 当前状态

> ⚠️ 脚手架：event 结构与 emit 函数已定义。Bridge 上链发布（sui_publisher）为 TODO。

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 定义 RiskAlert event 与 emit_alert，约定编码映射 |
