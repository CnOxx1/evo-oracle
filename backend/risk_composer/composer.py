"""可解释风险评分引擎。

把多条证据链加权合成 0–100 综合风险分，并给出每条链的贡献明细。
纯函数，无 IO，缺失字段降级为中性子分（50）。
"""

from __future__ import annotations

from typing import Any

# 证据链权重（和应为 1.0）
FACTOR_WEIGHTS: dict[str, float] = {
    "volatility": 0.30,
    "macro": 0.20,
    "trend": 0.20,
    "funding": 0.15,
    "sentiment": 0.15,
}

NEUTRAL_SUB_SCORE = 50.0


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def score_volatility(annualized_vol: float | None) -> tuple[float, str]:
    """年化波动率 → 风险子分。0.4↓ 低风险，2.0↑ 极高。"""
    if annualized_vol is None:
        return NEUTRAL_SUB_SCORE, "波动率数据缺失"
    # 线性映射：0.2→10, 2.0→100
    sub = _clamp((annualized_vol - 0.2) / (2.0 - 0.2) * 90 + 10)
    return sub, f"年化波动率 {annualized_vol:.2f}"


def score_macro(stance: str | None) -> tuple[float, str]:
    """宏观情绪 → 风险子分。risk_on 低，risk_off 高。"""
    mapping = {"risk_on": 25.0, "neutral": 50.0, "risk_off": 90.0}
    s = (stance or "neutral").lower()
    return mapping.get(s, NEUTRAL_SUB_SCORE), f"宏观 {s}"


def score_trend(trend_score: float | None) -> tuple[float, str]:
    """趋势评分（-2 ~ +2）→ 风险子分。越看跌风险越高。"""
    if trend_score is None:
        return NEUTRAL_SUB_SCORE, "趋势数据缺失"
    # +2(强看涨)→20, 0→50, -2(强看跌)→80
    sub = _clamp(50 - trend_score * 15)
    label = "看涨" if trend_score > 0.5 else "看跌" if trend_score < -0.5 else "中性"
    return sub, f"趋势{label}（score={trend_score}）"


def score_funding(funding_anomaly: dict[str, Any] | None) -> tuple[float, str]:
    """资金费率异常 → 风险子分。"""
    if not funding_anomaly:
        return NEUTRAL_SUB_SCORE, "资金费率数据缺失"
    if funding_anomaly.get("is_anomaly"):
        direction = funding_anomaly.get("direction", "")
        return 80.0, f"资金费率异常（{direction}）"
    return 35.0, "资金费率正常"


def score_sentiment(sentiment_score: float | None) -> tuple[float, str]:
    """新闻情感（-1 ~ +1）→ 风险子分。越负面风险越高。"""
    if sentiment_score is None:
        return NEUTRAL_SUB_SCORE, "情感数据缺失"
    # +1→20, 0→50, -1→80
    sub = _clamp(50 - sentiment_score * 30)
    label = "正面" if sentiment_score > 0.2 else "负面" if sentiment_score < -0.2 else "中性"
    return sub, f"新闻情感{label}（{sentiment_score:+.2f}）"


def _level_from_score(score: float) -> str:
    if score < 25:
        return "low"
    if score < 50:
        return "medium"
    if score < 75:
        return "high"
    return "extreme"


def compose_risk(
    signal: dict[str, Any] | None,
    macro: dict[str, Any] | None,
    sentiment: dict[str, Any] | None,
) -> dict[str, Any]:
    """合成综合风险分 + 拆解明细。

    Parameters
    ----------
    signal    : /signals/{symbol} 返回
    macro     : /macro/regime 返回
    sentiment : /sentiment/summary 返回
    """
    signal = signal or {}
    macro = macro or {}
    sentiment = sentiment or {}

    volatility = signal.get("volatility") or {}
    trend = signal.get("trend_signal") or {}
    funding = signal.get("funding_anomaly")
    news = (sentiment.get("news_sentiment_24h") or {}).get("score")

    symbol = (signal.get("symbol") or "").replace("/USDT", "")

    factor_scores: dict[str, tuple[float, str]] = {
        "volatility": score_volatility(volatility.get("annualized_vol")),
        "macro": score_macro(macro.get("overall_stance")),
        "trend": score_trend(trend.get("score")),
        "funding": score_funding(funding),
        "sentiment": score_sentiment(news),
    }

    breakdown: list[dict[str, Any]] = []
    composite = 0.0
    for factor, weight in FACTOR_WEIGHTS.items():
        sub_score, detail = factor_scores[factor]
        contribution = round(sub_score * weight, 2)
        composite += contribution
        breakdown.append({
            "factor": factor,
            "sub_score": round(sub_score, 1),
            "weight": weight,
            "contribution": contribution,
            "detail": detail,
        })

    breakdown.sort(key=lambda x: x["contribution"], reverse=True)
    composite = round(composite, 1)

    return {
        "symbol": symbol,
        "composite_risk_score": composite,
        "risk_level": _level_from_score(composite),
        "breakdown": breakdown,
        "top_drivers": [b["factor"] for b in breakdown[:2]],
    }
