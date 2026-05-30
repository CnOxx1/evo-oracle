"""信号转换：EvoQuantV3 JSON → Sui Move 链上整数 / 枚举格式。

纯函数，无 IO。缺失字段降级为安全默认值，不抛异常。
"""

from __future__ import annotations

from typing import Any

RISK_LEVEL_MAP = {"low": 0, "medium": 1, "high": 2, "extreme": 3}
TREND_MAP = {"bearish": 0, "neutral": 1, "bullish": 2}
MACRO_STANCE_MAP = {"risk_off": 0, "neutral": 1, "risk_on": 2}

RISK_SCORE_SCALE = 100      # risk_score 0–100 → 0–10000
VOL_SCALE = 10000           # annualized_vol → 整数


def encode_risk_level(label: str | None) -> int:
    return RISK_LEVEL_MAP.get((label or "medium").lower(), 1)


def encode_trend(direction: str | None) -> int:
    return TREND_MAP.get((direction or "neutral").lower(), 1)


def encode_macro_stance(stance: str | None) -> int:
    return MACRO_STANCE_MAP.get((stance or "neutral").lower(), 1)


def _safe_int(value: Any, scale: int, default: int = 0) -> int:
    try:
        return int(round(float(value) * scale))
    except (TypeError, ValueError):
        return default


def build_oracle_payload(
    signal: dict[str, Any] | None,
    risk: dict[str, Any] | None,
    macro: dict[str, Any] | None,
) -> dict[str, Any]:
    """合并信号 / 风险 / 宏观三个来源，输出链上 payload。

    Parameters
    ----------
    signal : /signals/{symbol} 返回
    risk   : /risk/score/{symbol} 返回
    macro  : /macro/regime 返回（全局共用）

    Returns
    -------
    dict 可直接传给 sui_publisher 的 update_risk
    """
    signal = signal or {}
    risk = risk or {}
    macro = macro or {}

    trend_signal = signal.get("trend_signal") or {}
    funding = signal.get("funding_anomaly") or {}

    symbol = (risk.get("symbol") or signal.get("symbol") or "").replace("/USDT", "")

    return {
        "symbol": symbol,
        "risk_score": _safe_int(risk.get("risk_score"), RISK_SCORE_SCALE),
        "risk_level": encode_risk_level(risk.get("risk_level")),
        "trend": encode_trend(trend_signal.get("direction")),
        "funding_anomaly": bool(funding.get("is_anomaly", False)),
        "macro_stance": encode_macro_stance(macro.get("overall_stance")),
        "annualized_vol": _safe_int(risk.get("annualized_vol"), VOL_SCALE),
    }
