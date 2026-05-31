"""Portfolio 追踪 — 模拟用户持仓分析。"""

from __future__ import annotations
from typing import Any


def compute_portfolio(
    risk_scores: dict[str, dict[str, Any]],
    funding_data: dict[str, Any],
) -> dict[str, Any]:
    """计算用户 portfolio 风险敞口。"""
    # 模拟用户持仓
    holdings = [
        {"asset": "SUI", "amount": 10000, "value_usd": 15000, "weight_pct": 50},
        {"asset": "BTC", "amount": 0.15, "value_usd": 9000, "weight_pct": 30},
        {"asset": "ETH", "amount": 2.5, "value_usd": 6000, "weight_pct": 20},
    ]

    total_value = sum(h["value_usd"] for h in holdings)
    weighted_risk = 0.0
    asset_details = []

    for h in holdings:
        symbol = h["asset"]
        risk_data = risk_scores.get(symbol, {})
        risk_score = risk_data.get("risk_score", 50)
        risk_level = risk_data.get("risk_level", "medium")
        weight = h["value_usd"] / total_value

        weighted_risk += risk_score * weight

        # 推荐权重：风险越高，建议权重越低
        recommended_weight = max(5, int((100 - risk_score) * weight * 1.5))
        drift = h["weight_pct"] - recommended_weight

        asset_details.append({
            "asset": symbol,
            "current_value_usd": h["value_usd"],
            "current_weight_pct": h["weight_pct"],
            "risk_score": risk_score,
            "risk_level": risk_level,
            "recommended_weight_pct": recommended_weight,
            "drift_pct": round(drift, 1),
            "action": "reduce" if drift > 10 else "increase" if drift < -10 else "hold",
        })

    # 归一化推荐权重
    total_rec = sum(a["recommended_weight_pct"] for a in asset_details)
    if total_rec > 0:
        for a in asset_details:
            a["recommended_weight_pct"] = round(a["recommended_weight_pct"] / total_rec * 100, 1)
            a["drift_pct"] = round(a["current_weight_pct"] - a["recommended_weight_pct"], 1)

    return {
        "total_value_usd": total_value,
        "portfolio_risk_score": round(weighted_risk, 1),
        "portfolio_risk_level": (
            "critical" if weighted_risk >= 75 else
            "high" if weighted_risk >= 55 else
            "medium" if weighted_risk >= 35 else "low"
        ),
        "holdings": asset_details,
        "rebalance_needed": any(abs(a["drift_pct"]) > 10 for a in asset_details),
        "potential_risk_reduction": round(weighted_risk * 0.15, 1),
    }
