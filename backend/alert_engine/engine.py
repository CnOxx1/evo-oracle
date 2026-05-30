"""异常检测引擎。

从市场信号中识别风险事件，输出带严重等级的告警列表。
纯函数，无 IO，输入缺失时跳过对应检测。
"""

from __future__ import annotations

from typing import Any

# 严重等级排序，用于求最高等级
SEVERITY_ORDER = {"info": 0, "warning": 1, "critical": 2}

THRESHOLDS = {
    "vol_elevated": 0.8,        # 年化波动率进入 elevated
    "vol_extreme": 1.5,         # 进入 extreme
    "risk_high": 50.0,          # 综合风险分 high
    "risk_extreme": 75.0,       # extreme
    "bearish_trend": -1.0,      # 强看跌趋势
    "negative_sentiment": -0.5, # 负面情感
}


def _alert(atype: str, severity: str, message: str, value: Any = None) -> dict[str, Any]:
    return {"type": atype, "severity": severity, "message": message, "value": value}


def detect_alerts(
    signal: dict[str, Any] | None,
    composite_risk: dict[str, Any] | None = None,
    macro: dict[str, Any] | None = None,
    sentiment: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """检测异常，返回告警列表。

    Parameters
    ----------
    signal         : /signals/{symbol} 返回
    composite_risk : risk_composer.compose_risk 输出（可选）
    macro          : /macro/regime 返回（可选）
    sentiment      : /sentiment/summary 返回（可选）
    """
    signal = signal or {}
    alerts: list[dict[str, Any]] = []

    symbol = (signal.get("symbol") or "").replace("/USDT", "")

    # 1. 资金费率异常
    funding = signal.get("funding_anomaly") or {}
    if funding.get("is_anomaly"):
        alerts.append(_alert(
            "funding_spike", "warning",
            f"资金费率异常：{funding.get('direction', 'unknown')}",
            funding.get("rate"),
        ))

    # 2. 波动率突破
    volatility = signal.get("volatility") or {}
    vol = volatility.get("annualized_vol")
    if vol is not None:
        if vol >= THRESHOLDS["vol_extreme"]:
            alerts.append(_alert(
                "volatility_breakout", "critical",
                f"年化波动率 {vol:.2f} 进入 extreme 区间", vol,
            ))
        elif vol >= THRESHOLDS["vol_elevated"]:
            alerts.append(_alert(
                "volatility_breakout", "warning",
                f"年化波动率 {vol:.2f} 进入 elevated 区间", vol,
            ))

    # 3. 综合风险升级
    if composite_risk:
        score = composite_risk.get("composite_risk_score")
        if score is not None:
            if score >= THRESHOLDS["risk_extreme"]:
                alerts.append(_alert(
                    "risk_escalation", "critical",
                    f"综合风险分 {score} 进入 extreme", score,
                ))
            elif score >= THRESHOLDS["risk_high"]:
                alerts.append(_alert(
                    "risk_escalation", "warning",
                    f"综合风险分 {score} 进入 high", score,
                ))

    # 4. 宏观翻转
    if macro and (macro.get("overall_stance") == "risk_off"):
        alerts.append(_alert(
            "macro_flip", "warning", "宏观情绪转为 risk_off",
            macro.get("overall_stance"),
        ))

    # 5. 强看跌趋势
    trend = signal.get("trend_signal") or {}
    tscore = trend.get("score")
    if tscore is not None and tscore <= THRESHOLDS["bearish_trend"]:
        alerts.append(_alert(
            "bearish_trend", "info",
            f"趋势强看跌（score={tscore}）", tscore,
        ))

    # 6. 负面情感
    if sentiment:
        s = (sentiment.get("news_sentiment_24h") or {}).get("score")
        if s is not None and s <= THRESHOLDS["negative_sentiment"]:
            alerts.append(_alert(
                "negative_sentiment", "info",
                f"新闻情感强负面（{s:+.2f}）", s,
            ))

    summary = summarize_alerts(alerts)
    return {
        "symbol": symbol,
        "alert_count": len(alerts),
        "highest_severity": summary["highest_severity"],
        "alerts": alerts,
    }


def summarize_alerts(alerts: list[dict[str, Any]]) -> dict[str, Any]:
    """汇总：最高等级 + 各等级计数。"""
    counts = {"info": 0, "warning": 0, "critical": 0}
    highest = None
    highest_rank = -1
    for a in alerts:
        sev = a.get("severity", "info")
        counts[sev] = counts.get(sev, 0) + 1
        if SEVERITY_ORDER.get(sev, 0) > highest_rank:
            highest_rank = SEVERITY_ORDER.get(sev, 0)
            highest = sev
    return {"highest_severity": highest, "counts": counts}
