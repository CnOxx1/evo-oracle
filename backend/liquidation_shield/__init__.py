"""清算级联保护引擎。

基于 OI（持仓量）变化 + 资金费率异常 + 组合风险数据计算清算风险。
已接入真实 OI 数据，清算激增数据 graceful fallback。
"""

from __future__ import annotations

from typing import Any


def _oi_risk_factor(oi_data: dict[str, Any]) -> float:
    """从 OI 数据计算杠杆堆积风险因子 (0~1)。

    OI 24h 变化率越大 -> 新杠杆仓位越多 -> 清算风险越高。
    """
    by_exchange = oi_data.get("by_exchange", {})
    if not by_exchange:
        return 0.0

    max_change_pct = 0.0
    for ex_data in by_exchange.values():
        oi_val = ex_data.get("open_interest_usd") or ex_data.get("open_interest_contracts", 0)
        change_24h = ex_data.get("open_interest_change_24h", 0)
        if oi_val and oi_val > 0:
            change_pct = abs(change_24h) / oi_val
            max_change_pct = max(max_change_pct, change_pct)

    # 24h OI 变化超过 10% 视为极端
    return min(max_change_pct / 0.10, 1.0)


def compute_liquidation_risk(
    funding_all: dict[str, Any],
    portfolio_risk: dict[str, Any],
    correlation: dict[str, Any],
    open_interest: dict[str, Any] | None = None,
    liquidation_surges: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """计算清算级联风险。

    数据源：
    - /exchange/funding -> 资金费率极端值 -> 仓位拥挤信号
    - /exchange/open-interest -> OI 变化 -> 杠杆堆积 [已接入]
    - /risk/portfolio/latest -> VaR + 波动率
    - /cross-asset/correlation -> 级联效应放大器
    - /monitor/liquidation-surges -> 清算激增 [graceful]
    """
    funding_rates = funding_all.get("funding_rates", {})
    var_95 = portfolio_risk.get("daily_var_95", 0)
    var_99 = portfolio_risk.get("daily_var_99", 0)
    vol = portfolio_risk.get("annualized_volatility", 0)
    avg_corr = correlation.get("avg_correlation", 0)

    # OI 数据查找表
    oi_lookup: dict[str, dict] = {}
    if open_interest:
        for symbol, oi_data in open_interest.items():
            oi_lookup[symbol] = oi_data

    # 真实清算激增
    has_surge_data = bool(liquidation_surges and liquidation_surges.get("count", 0) > 0)

    # 逐资产分析清算风险
    assets = []
    for symbol, data in funding_rates.items():
        avg_rate = data.get("avg_rate", 0)
        annualized = data.get("annualized_rate", 0)
        is_elevated = data.get("is_elevated", False)

        # 因子1: 资金费率极端值 (0~1)
        funding_extremity = min(abs(annualized) / 0.5, 1.0)

        # 因子2: OI 杠杆堆积 (0~1)
        oi_factor = 0.0
        oi_value_usd = None
        oi_change_24h_pct = None
        if symbol in oi_lookup:
            oi_factor = _oi_risk_factor(oi_lookup[symbol])
            oi_value_usd = oi_lookup[symbol].get("total_oi_value_usd")
            # 计算 24h 变化百分比
            by_ex = oi_lookup[symbol].get("by_exchange", {})
            for ex_data in by_ex.values():
                oi_val = ex_data.get("open_interest_usd") or ex_data.get("open_interest_contracts", 0)
                chg = ex_data.get("open_interest_change_24h", 0)
                if oi_val and oi_val > 0:
                    oi_change_24h_pct = round(chg / oi_val * 100, 2)
                    break

        # 因子3: 相关性放大器
        cascade_multiplier = 1 + max(0, avg_corr - 0.3) * 2

        # 综合清算风险 = (funding * 0.4 + oi * 0.6) * cascade
        raw_score = (funding_extremity * 0.4 + oi_factor * 0.6) * cascade_multiplier * 100
        liq_risk_score = round(min(100, raw_score), 1)

        risk_level = (
            "critical" if liq_risk_score >= 70
            else "high" if liq_risk_score >= 50
            else "medium" if liq_risk_score >= 30
            else "low"
        )

        asset_entry = {
            "symbol": symbol.replace("/USDT", ""),
            "funding_rate": round(avg_rate, 6),
            "annualized_rate": round(annualized, 4),
            "is_elevated": is_elevated,
            "oi_risk_factor": round(oi_factor, 3),
            "oi_value_usd": oi_value_usd,
            "oi_change_24h_pct": oi_change_24h_pct,
            "liquidation_risk_score": liq_risk_score,
            "risk_level": risk_level,
            "cascade_multiplier": round(cascade_multiplier, 2),
        }
        assets.append(asset_entry)

    # 排序
    assets.sort(key=lambda x: x["liquidation_risk_score"], reverse=True)

    # 全局清算级联风险
    high_risk_count = sum(1 for a in assets if a["risk_level"] in ("high", "critical"))
    avg_liq_score = sum(a["liquidation_risk_score"] for a in assets) / max(len(assets), 1)

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

    # 数据源状态
    data_sources = ["funding_rate", "portfolio_var", "correlation_matrix"]
    if oi_lookup:
        data_sources.append("open_interest")
    if has_surge_data:
        data_sources.append("liquidation_surges")

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
        "assets": assets[:10],
        "data_sources_active": data_sources,
        "has_real_oi": bool(oi_lookup),
        "has_real_liquidations": has_surge_data,
    }
