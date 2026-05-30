# perp_adapter 模块（Move）

永续合约协议适配器示例。演示永续 DEX 如何用 EvoOracle 把**固定最大杠杆变成动态最大杠杆**——风险越高，允许的杠杆越低，从源头抑制级联爆仓。

## 核心价值

```
传统永续：最大杠杆固定 20x，极端行情也不变 → 插针式爆仓连锁
EvoOracle：风险升高自动降低最大杠杆，保护新开仓用户
```

与 `lending_adapter` 一起，证明同一个 Oracle 可服务**多种协议形态**——这是"协议层"而非"单一产品"的关键论据。

## 风险评分 → 最大杠杆映射

| risk_score | 风险 | 最大杠杆 |
| --- | --- | --- |
| 0–2500 | low | 20x |
| 2500–5000 | medium | 10x |
| 5000–7500 | high | 5x |
| 7500–10000 | extreme | 2x |

> 额外规则：当 Oracle 标记 `funding_anomaly` 时，可进一步下调一档，抑制拥挤方向加仓。

## 数据结构

### PerpMarket（共享对象，演示用）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `symbol` | `String` | 标的资产 |
| `current_max_leverage` | `u64` | 当前最大杠杆倍数 |
| `is_oracle_driven` | `bool` | 是否启用动态杠杆 |
| `last_updated` | `u64` | 上次更新时间 |

## 函数

| 函数 | 说明 |
| --- | --- |
| `create_market(symbol, is_oracle_driven, ctx)` | 创建永续市场 |
| `compute_max_leverage(risk_score, funding_anomaly)` | 纯函数：风险分(+异常) → 最大杠杆 |
| `sync_leverage(market, snapshot, clock)` | 读取 Oracle，更新最大杠杆 |
| `get_max_leverage(market)` | 读取当前最大杠杆 |

## 当前状态

> ⚠️ 脚手架：杠杆映射与同步逻辑已实现；真实永续的开仓/资金费率/清算逻辑不在本示例范围。

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 定义动态最大杠杆映射与 sync_leverage，演示永续协议接入 |
