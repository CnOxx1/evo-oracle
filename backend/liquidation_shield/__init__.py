"""清算级联保护引擎。

基于资金费率异常 + 组合风险数据模拟清算风险，
待 EvoQuantV3 清算/OI 数据就绪后切换为真实数据源。
"""

from __future__ import annotations

from typing import Any


def compute_liquidation_risk(
    funding_all: dict[str, Any],
    portfolio_risk: dict[str, Any],
    correlation: dict[str, Any],
) -> dict[str, Any]:
    """计算清算级联风险。

    当前基于：
    - 资金费率极端值 → 仓位拥挤 → 清算概率升高
    - 组合 VaR → 极端波动下损失预估
    - 高相关性集群 → 级联效应放大器

    待接入（EvoQuantV3 开发中）：
    - /exchange/liquidations → 真实清算量
    - /monitor/liquidation-surges → 清算激增检测
    - /exchange/open-interest → OI 突变
    """
    funding_rates = funding_all.get("funding_rates", {})
    var_95 = portfolio_risk.get("daily_var_95", 0)
    var_99 = portfolio_risk.get("daily_var_99", 0)
    vol = portfolio_risk.get("annualized_volatility", 0)
    avg_corr = correlation.get("avg_correlation", 0)

    # 逐资产分析清算风险
    assets = []
    for symbol, data in funding_rates.items():
        avg_rate = data.get("avg_rate", 0)
        annualized = data.get("annualized_rate", 0)
        is_elevated = data.get("is_elevated", False)

        # 清算风险因子：资金费率越极端 → 单边仓位越拥挤 → 清算概率越高
        funding_extremity = min(abs(annualized) / 0.5, 1.0)  # 年化 50% 为极端
        # 考虑相关性放大
        cascade_multiplier = 1 + max(0, avg_corr - 0.3) * 2

        liq_risk_score = round(funding_extremity * cascade_multiplier * 100, 1)
        liq_risk_score = min(100, liq_risk_score)

        risk_level = (
            "critical" if liq_risk_score >= 70
            else "high" if liq_risk_score >= 50
            else "medium" if liq_risk_score >= 30
            else "low"
        )

        assets.append({
            "symbol": symbol.replace("/USDT", ""),
            "funding_rate": round(avg_rate, 6),
            "annualized_rate": round(annualized, 4),
            "is_elevated": is_elevated,
            "liquidation_risk_score": liq_risk_score,
            "risk_level": risk_level,
            "cascade_multiplier": round(cascade_multiplier, 2),
        })

    # 排序：风险最高的在前
    assets.sort(key=lambda x: x["liquidation_risk_score"], reverse=True)

    # 全局清算级联风险
    high_risk_count = sum(1 for a in assets if a["risk_level"] in ("high", "critical"))
    avg_liq_score = sum(a["liquidation_risk_score"] for a in assets) / max(len(assets), 1)

    # 级联风险 = 高风险资产数 × 相关性 × 波动率
    cascade_score = min(100, avg_liq_score * (1 + avg_corr) * (1 + vol))

    if cascade_score >= 70:
        shield_status = "active"
        shield_action = "全面减仓：多资产清算风险联动，建议退出高杠杆仓位"
    elif cascade_score >= 40:
        shield_status = "warning"
        shield_action = "部分减仓：部分资产资金费率异常，建议降低杠杆"
    else:
        shield_status = "safe"
        shield_action = "正常运行：清算风险可控"

    return {
        "shield_status": shield_status,
        "shield_action": shield_action,
        "cascade_risk": {
            "score": round(cascade_score, 1),
            "level": "critical" if cascade_score >= 70 else "high" if cascade_score >= 40 else "low",
            "high_risk_assets": high_risk_count,
            "avg_risk_score": round(avg_liq_score, 1),
        },
        "portfolio_context": {
            "daily_var_95": round(var_95, 6),
            "daily_var_99": round(var_99, 6),
            "annualized_volatility": round(vol, 4),
            "avg_correlation": round(avg_corr, 4),
        },
        "assets": assets[:10],  # Top 10 高风险资产
        "data_source": "funding_rate_proxy",
        "pending_upgrade": [
            "/exchange/liquidations — 真实清算量",
            "/monitor/liquidation-surges — 清算激增检测",
            "/exchange/open-interest — OI 突变",
        ],
    }
