# lending_adapter 模块（Move）

借贷协议适配器示例。演示任何 Sui 借贷协议如何用 EvoOracle 把**固定抵押率（LTV）变成动态抵押率**——这是 EvoOracle「协议层价值」最清晰的卖点。

## 核心价值

```
传统借贷：LTV 固定 80%，市场暴涨暴跌都不变 → 级联清算风险
EvoOracle：风险越高 LTV 自动收紧，风险越低适度放开
```

## 风险评分 → 最大 LTV 映射

| risk_score | 风险 | 最大 LTV |
| --- | --- | --- |
| 0–2500 | low | 85% |
| 2500–5000 | medium | 75% |
| 5000–7500 | high | 60% |
| 7500–10000 | extreme | 40% |

> 对比：LUNA 崩盘期间，固定 80% LTV 的协议被击穿；动态 LTV 会在风险升高时提前降到 40%，给借款人留出补仓/平仓窗口。

## 数据结构

### LendingMarket（共享对象，演示用）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `symbol` | `String` | 抵押资产 |
| `current_max_ltv` | `u64` | 当前最大 LTV ×100 |
| `is_oracle_driven` | `bool` | 是否启用动态 LTV |
| `last_updated` | `u64` | 上次更新时间 |

## 函数

| 函数 | 说明 |
| --- | --- |
| `create_market(symbol, is_oracle_driven, ctx)` | 创建借贷市场 |
| `compute_max_ltv(risk_score)` | 纯函数：风险分 → 最大 LTV |
| `sync_ltv(market, snapshot, clock)` | 读取 Oracle，更新 LTV |
| `get_max_ltv(market)` | 读取当前 LTV |

## 接入成本

协议方接入只需 3 步：

```move
// 1. 引用 EvoOracle 的 RiskSnapshot
// 2. 调用 oracle::get_risk_score + is_data_fresh
// 3. 用 compute_max_ltv 映射成本协议参数
```

## 当前状态

> ⚠️ 脚手架：LTV 映射与同步逻辑已实现；真实借贷的抵押/借出/清算逻辑不在本示例范围（这是适配器演示，非完整借贷协议）。

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 定义动态 LTV 映射与 sync_ltv，演示借贷协议接入方式 |
