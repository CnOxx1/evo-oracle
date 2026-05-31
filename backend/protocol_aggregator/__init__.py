"""Multi-Protocol Risk Aggregation - 多协议联动。

同一个 Oracle 风险评分同时计算 Lending LTV、Perp 最大杠杆、Vault 目标仓位，
展示一个信号如何同时保护多个协议。
"""

from __future__ import annotations

from typing import Any


# ---- 静态参数（无 Oracle 保护时的默认值）----
STATIC_LTV = 0.75  # 借贷协议默认 LTV
STATIC_MAX_LEVERAGE = 20  # 永续合约默认最大杠杆
STATIC_SUI_PCT = 50  # Vault 默认 SUI 占比

# ---- 动态参数映射曲线 ----
# risk_score 0 → 最宽松, 100 → 最保守


def _dynamic_ltv(risk_score: int) -> float:
    """风险评分 → 动态 LTV。

    risk=0  → LTV=0.80 (宽松)
    risk=50 → LTV=0.65 (中等)
    risk=100 → LTV=0.30 (极保守)
    """
    # 线性插值 + 非线性加速
    base = 0.80
    reduction = (risk_score / 100) ** 1.3 * 0.50
    return round(max(base - reduction, 0.20), 3)


def _dynamic_max_leverage(risk_score: int) -> int:
    """风险评分 → 最大杠杆倍数。

    risk=0  → 20x
    risk=50 → 10x
    risk=100 → 2x
    """
    leverage = max(2, int(20 - (risk_score / 100) * 18))
    return leverage


def _dynamic_sui_pct(risk_score: int) -> int:
    """风险评分 → Vault SUI 目标仓位百分比。

    risk=0  → 80% SUI
    risk=50 → 45% SUI
    risk=100 → 5% SUI
    """
    pct = max(5, int(80 - (risk_score / 100) ** 1.2 * 75))
    return pct


def _protection_effect(dynamic_val: float, static_val: float) -> dict[str, Any]:
    """计算保护效果对比。"""
    diff = dynamic_val - static_val
    reduction_pct = round(abs(diff) / max(abs(static_val), 0.01) * 100, 1)
    direction = "tighter" if diff < 0 else "looser"
    return {
        "direction": direction,
        "change_pct": reduction_pct,
    }


def compute_protocol_params(
    risk_score: int, symbol: str
) -> dict[str, Any]:
    """根据 Oracle 风险评分计算多协议参数。

    Args:
        risk_score: 0-100 风险评分
        symbol: 资产符号

    Returns:
        三个协议的参数对比 + 保护效果描述。
    """
    risk_score = max(0, min(100, risk_score))

    # 动态参数
    dyn_ltv = _dynamic_ltv(risk_score)
    dyn_leverage = _dynamic_max_leverage(risk_score)
    dyn_sui_pct = _dynamic_sui_pct(risk_score)

    # Lending 协议
    lending = {
        "protocol": "Lending (借贷)",
        "parameter": "Loan-to-Value (LTV)",
        "with_oracle": {
            "ltv": dyn_ltv,
            "max_borrow_per_1000_collateral": round(dyn_ltv * 1000, 0),
            "description": f"动态 LTV = {dyn_ltv:.1%}",
        },
        "without_oracle": {
            "ltv": STATIC_LTV,
            "max_borrow_per_1000_collateral": round(STATIC_LTV * 1000, 0),
            "description": f"静态 LTV = {STATIC_LTV:.0%}（不随风险调整）",
        },
        "protection_effect": _protection_effect(dyn_ltv, STATIC_LTV),
    }

    # Perp 协议
    perp = {
        "protocol": "Perpetual (永续合约)",
        "parameter": "Max Leverage",
        "with_oracle": {
            "max_leverage": dyn_leverage,
            "description": f"动态最大杠杆 = {dyn_leverage}x",
        },
        "without_oracle": {
            "max_leverage": STATIC_MAX_LEVERAGE,
            "description": f"静态最大杠杆 = {STATIC_MAX_LEVERAGE}x（不随风险调整）",
        },
        "protection_effect": _protection_effect(dyn_leverage, STATIC_MAX_LEVERAGE),
    }

    # Vault 协议
    vault = {
        "protocol": "Vault (资管金库)",
        "parameter": "Target SUI Allocation",
        "with_oracle": {
            "sui_pct": dyn_sui_pct,
            "usdc_pct": 100 - dyn_sui_pct,
            "description": f"动态仓位 SUI={dyn_sui_pct}% / USDC={100 - dyn_sui_pct}%",
        },
        "without_oracle": {
            "sui_pct": STATIC_SUI_PCT,
            "usdc_pct": 100 - STATIC_SUI_PCT,
            "description": f"静态仓位 SUI={STATIC_SUI_PCT}% / USDC={100 - STATIC_SUI_PCT}%（不随风险调整）",
        },
        "protection_effect": _protection_effect(dyn_sui_pct, STATIC_SUI_PCT),
    }

    # 综合保护描述
    risk_label = (
        "极高风险" if risk_score >= 80 else
        "高风险" if risk_score >= 60 else
        "中等风险" if risk_score >= 40 else
        "低风险" if risk_score >= 20 else
        "极低风险"
    )

    summary = (
        f"当前 {symbol} 风险评分 = {risk_score} ({risk_label})。"
        f"Oracle 同时将 Lending LTV 从 {STATIC_LTV:.0%} 调整至 {dyn_ltv:.1%}，"
        f"Perp 杠杆从 {STATIC_MAX_LEVERAGE}x 降至 {dyn_leverage}x，"
        f"Vault SUI 敞口从 {STATIC_SUI_PCT}% 降至 {dyn_sui_pct}%。"
        f"一个信号，三重保护。"
    )

    return {
        "symbol": symbol.upper(),
        "risk_score": risk_score,
        "risk_label": risk_label,
        "protocols": [lending, perp, vault],
        "summary": summary,
    }