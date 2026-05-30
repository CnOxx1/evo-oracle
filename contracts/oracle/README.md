# oracle 模块（Move）

EvoOracle 的链上风险预言机。存储各资产的风险评分与 AI 信号，由授权的 Bridge 更新，任何协议可公开读取。

## 数据结构

### RiskSnapshot（共享对象）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `symbol` | `String` | 资产符号，如 "SUI" |
| `risk_score` | `u64` | 风险评分 0–10000（实际值 ×100） |
| `risk_level` | `u8` | 0=low 1=medium 2=high 3=extreme |
| `trend` | `u8` | 0=bearish 1=neutral 2=bullish |
| `funding_anomaly` | `bool` | 资金费率是否异常 |
| `macro_stance` | `u8` | 0=risk_off 1=neutral 2=risk_on |
| `annualized_vol` | `u64` | 年化波动率（实际值 ×10000） |
| `updated_at` | `u64` | 最后更新时间戳（ms） |

### OracleAdminCap（能力对象）

授权凭证。只有持有者（Bridge）能调用 `update_risk`。

## 函数

| 函数 | 权限 | 说明 |
| --- | --- | --- |
| `create_snapshot(symbol, ctx)` | AdminCap | 为某资产创建共享的 RiskSnapshot |
| `update_risk(cap, snapshot, ...)` | AdminCap | 更新风险快照 |
| `get_risk_score(snapshot)` | public | 读取风险评分 |
| `get_risk_level(snapshot)` | public | 读取风险等级 |
| `get_trend(snapshot)` | public | 读取趋势 |
| `is_data_fresh(snapshot, clock)` | public | 数据是否新鲜（< 1 小时） |

## 消费方式（其他协议）

```move
let score = oracle::get_risk_score(snapshot);
if (oracle::is_data_fresh(snapshot, clock)) {
    // 根据 score 动态调整本协议参数
}
```

## 设计要点

- RiskSnapshot 为**共享对象**，任何交易可读
- 写入受 AdminCap 门控，防止伪造
- `is_data_fresh` 让消费方能拒绝过期数据，防止 Oracle 停更导致误判

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 定义 RiskSnapshot / AdminCap 与读写函数骨架 |
