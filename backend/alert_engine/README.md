# alert_engine 模块

异常检测引擎。从市场信号中识别风险事件，输出带严重等级的告警列表。是「安全背景」的直接体现——把攻击/异常检测思路用在市场风险上。

## 检测的异常类型

| 类型 | 触发条件 | 严重等级 |
| --- | --- | --- |
| `funding_spike` | 资金费率异常（is_anomaly=true） | warning |
| `volatility_breakout` | 年化波动率进入 elevated/extreme regime | warning / critical |
| `risk_escalation` | 综合风险分进入 high/extreme | warning / critical |
| `macro_flip` | 宏观情绪为 risk_off | warning |
| `bearish_trend` | 趋势强看跌（score ≤ -1.0） | info |
| `negative_sentiment` | 新闻情感分 ≤ -0.5 | info |

## 严重等级

| 等级 | 含义 |
| --- | --- |
| `info` | 提示，无需行动 |
| `warning` | 需关注，建议收紧风险 |
| `critical` | 高危，建议立即降敞口 |

## 主要函数

| 函数 | 说明 |
| --- | --- |
| `detect_alerts(signal, composite_risk, macro, sentiment)` | 返回告警列表 |
| `summarize_alerts(alerts)` | 汇总：最高等级 + 各等级计数 |

## 输出结构

```json
{
  "symbol": "SUI",
  "alert_count": 2,
  "highest_severity": "critical",
  "alerts": [
    {"type": "volatility_breakout", "severity": "critical", "message": "年化波动率 1.8 进入 extreme 区间", "value": 1.8},
    {"type": "funding_spike", "severity": "warning", "message": "资金费率异常：long_biased", "value": 0.0012}
  ]
}
```

## 与链上的关系

告警可经 `sui_publisher` 调用合约 `alert::emit_alert` 发为链上 event，协议可订阅。
> 链上发布为 TODO，当前先经 `server` 暴露给前端展示。

## 设计要点

- 纯函数，无 IO，输入缺失时跳过对应检测，不抛异常
- 阈值集中在 `THRESHOLDS`，可调
- 可组合：信号 → risk_composer → alert_engine 串联

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 初始化异常检测引擎，定义 6 类告警与三级严重度 |
