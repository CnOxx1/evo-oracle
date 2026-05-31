"""协议安全排名对比 — 按风险调整后收益率排序。"""

from __future__ import annotations
from typing import Any


def compute_protocol_comparison(
    risk_scores: dict[str, dict[str, Any]],
    funding_data: dict[str, Any],
) -> dict[str, Any]:
    """计算各协议的风险调整后排名。"""
    rates = funding_data.get("funding_rates", {})

    protocols = [
        {
            "name": "Scallop Lending",
            "type": "lending",
            "base_apy": 8.5,
            "ltv": 75,
            "liquidation_penalty": 10,
            "oracle_integrated": True,
        },
        {
            "name": "NAVI Protocol",
            "type": "lending",
            "base_apy": 7.2,
            "ltv": 70,
            "liquidation_penalty": 8,
            "oracle_integrated": False,
        },
        {
            "name": "Bluefin Perp",
            "type": "perp",
            "base_apy": 12.0,
            "max_leverage": 20,
            "liquidation_penalty": 5,
            "oracle_integrated": True,
        },
        {
            "name": "Aftermath Finance",
            "type": "vault",
            "base_apy": 5.8,
            "ltv": 0,
            "liquidation_penalty": 0,
            "oracle_integrated": True,
        },
        {
            "name": "Cetus AMM",
            "type": "dex",
            "base_apy": 15.0,
            "ltv": 0,
            "liquidation_penalty": 0,
            "oracle_integrated": False,
        },
    ]

    # 计算风险调整后评分
    avg_risk = sum(r.get("risk_score", 50) for r in risk_scores.values()) / max(len(risk_scores), 1)
    ranked = []

    for proto in protocols:
        # 风险调整后 APY
        risk_penalty = avg_risk * 0.1 if not proto["oracle_integrated"] else avg_risk * 0.04
        adjusted_apy = proto["base_apy"] - risk_penalty
        # 安全评分
        safety_score = 100 - proto["liquidation_penalty"] * 2 - (100 - proto.get("ltv", 50)) * 0.1
        if proto["oracle_integrated"]:
            safety_score += 15

        safety_score = max(0, min(100, safety_score))

        ranked.append({
            **proto,
            "risk_adjusted_apy": round(adjusted_apy, 2),
            "safety_score": round(safety_score, 1),
            "current_risk_exposure": round(avg_risk * (0.6 if not proto["oracle_integrated"] else 0.3), 1),
        })

    ranked.sort(key=lambda x: x["safety_score"], reverse=True)
    for i, p in enumerate(ranked):
        p["rank"] = i + 1

    return {
        "protocols": ranked,
        "market_risk_score": round(avg_risk, 1),
        "safest_protocol": ranked[0]["name"] if ranked else "",
        "highest_yield": max(ranked, key=lambda x: x["risk_adjusted_apy"])["name"] if ranked else "",
    }
