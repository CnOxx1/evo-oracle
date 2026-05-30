# signal_processor 模块

把 EvoQuantV3 返回的 JSON（含浮点、字符串枚举）转换成 Sui Move 合约能直接消费的**整数 / 枚举编码**格式。

## 为什么需要这个模块

Move 合约不支持浮点数，且枚举用 `u8` 表示。本模块负责：

- 浮点数 → 定点整数（乘以固定倍数）
- 字符串枚举 → `u8` 编码
- 字段裁剪：只保留上链需要的字段，降低 gas

## 编码规则

| 字段 | 来源 | 链上类型 | 编码方式 |
| --- | --- | --- | --- |
| `risk_score` | `/risk/score` risk_score | `u64` | `round(value * 100)` (0–10000) |
| `risk_level` | risk_level | `u8` | low=0 / medium=1 / high=2 / extreme=3 |
| `trend` | signal trend direction | `u8` | bearish=0 / neutral=1 / bullish=2 |
| `funding_anomaly` | funding_anomaly.is_anomaly | `bool` | 原样 |
| `macro_stance` | macro overall_stance | `u8` | risk_off=0 / neutral=1 / risk_on=2 |
| `annualized_vol` | annualized_vol | `u64` | `round(value * 10000)` |

## 主要函数

| 函数 | 说明 |
| --- | --- |
| `build_oracle_payload(signal, risk, macro)` | 合并三个数据源，输出链上 payload dict |
| `encode_risk_level(label)` | 风险等级字符串 → u8 |
| `encode_trend(direction)` | 趋势字符串 → u8 |
| `encode_macro_stance(stance)` | 宏观情绪字符串 → u8 |

## 用法

```python
from signal_processor.processor import build_oracle_payload

payload = build_oracle_payload(signal_dict, risk_dict, macro_dict)
# {'symbol': 'SUI', 'risk_score': 6250, 'risk_level': 2, 'trend': 2, ...}
```

## 设计要点

- 纯函数，无 IO，无副作用，易测试
- 缺失字段降级为安全默认值（risk_level=medium、trend=neutral）
- 不抛异常，保证 Bridge 主循环稳定

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 初始化转换逻辑，定义链上编码规则 |
