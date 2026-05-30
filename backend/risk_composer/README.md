# risk_composer 模块

可解释风险评分引擎。把 EvoQuantV3 的多条证据链加权合成一个 0–100 的综合风险分，并**给出每条证据链的贡献明细**——让风险分从"黑盒"变成"白盒"。

## 为什么重要

传统预言机只给一个数字，协议无法判断它是否可信。EvoOracle 的风险分附带拆解：

> "SUI 风险分 68（high），主要来自波动率（贡献 24）+ 宏观逆风（贡献 18）+ 资金费率异常（贡献 12）。"

评委一眼看懂技术深度，协议方也能据此决定信任程度。

## 证据链与权重

| 证据链 | 权重 | 来源字段 | 含义 |
| --- | --- | --- | --- |
| `volatility` | 0.30 | annualized_vol | 年化波动率 |
| `macro` | 0.20 | macro overall_stance | 宏观风险环境 |
| `trend` | 0.20 | trend_signal.score | 趋势方向与强度 |
| `funding` | 0.15 | funding_anomaly | 衍生品拥挤度 |
| `sentiment` | 0.15 | news sentiment score | 新闻情感 |

权重定义在 `FACTOR_WEIGHTS`，可调。每条链先映射到 0–100 子分，再按权重加权求和。

## 主要函数

| 函数 | 说明 |
| --- | --- |
| `compose_risk(signal, macro, sentiment)` | 合成综合风险分 + 拆解明细 |
| `score_volatility(annualized_vol)` | 波动率 → 子分 |
| `score_macro(stance)` | 宏观情绪 → 子分 |
| `score_trend(trend_score)` | 趋势 → 子分 |
| `score_funding(funding_anomaly)` | 资金费率 → 子分 |
| `score_sentiment(sentiment_score)` | 情感 → 子分 |

## 输出结构

```json
{
  "symbol": "SUI",
  "composite_risk_score": 68.0,
  "risk_level": "high",
  "breakdown": [
    {"factor": "volatility", "sub_score": 80, "weight": 0.30, "contribution": 24.0, "detail": "年化波动率 0.91"},
    {"factor": "macro", "sub_score": 90, "weight": 0.20, "contribution": 18.0, "detail": "宏观 risk_off"}
  ],
  "top_drivers": ["volatility", "macro"]
}
```

## 设计要点

- 纯函数，无 IO，缺失字段降级为中性子分（50），不抛异常
- 与 `signal_processor` 区别：后者只做格式转换；本模块做**风险建模 + 解释**
- `composite_risk_score` 同样可经 `signal_processor` 编码上链

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 初始化可解释风险评分引擎，定义 5 条证据链加权模型 |
