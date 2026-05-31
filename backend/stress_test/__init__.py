"""Risk Contagion Simulation - 压力测试模拟器。

用户输入 "BTC 跌 20%"，基于相关性矩阵计算所有资产的预期损失，
识别级联清算风险。
"""

from __future__ import annotations

from typing import Any

from api_client.client import EvoQuantClient, EvoQuantAPIError


# 各资产的 beta 估计（相对 BTC），用于放大/缩小冲击传导
DEFAULT_BETAS: dict[str, float] = {
    "BTC": 1.0, "ETH": 1.2, "SOL": 1.5, "SUI": 1.6,
    "AVAX": 1.4, "DOGE": 1.8, "LINK": 1.3, "DOT": 1.4,
    "MATIC": 1.5, "ADA": 1.3, "UNI": 1.4, "AAVE": 1.3,
    "ARB": 1.5, "OP": 1.5, "ATOM": 1.3, "APT": 1.5,
    "FIL": 1.4, "LTC": 1.1,
}

# 假设各资产 OI 对应的杠杆倍数中位数
MEDIAN_LEVERAGE: float = 10.0


def _risk_level(expected_loss_pct: float) -> str:
    """根据预期损失判断清算风险等级。"""
    abs_loss = abs(expected_loss_pct)
    if abs_loss >= 15:
        return "critical"
    elif abs_loss >= 8:
        return "high"
    elif abs_loss >= 3:
        return "medium"
    return "low"


def _estimate_liquidation_usd(
    expected_loss_pct: float, oi_data: dict[str, Any]
) -> float:
    """估算因价格变动触发的清算金额（USD）。"""
    total_oi = oi_data.get("open_interest", 0)
    if not total_oi:
        return 0.0
    # 假设仓位均匀分布在 2x-20x 杠杆
    # 价格变动超过 1/leverage 时触发清算
    liquidated = 0.0
    for lev in range(2, 21):
        portion = total_oi / 19  # 均匀分布
        threshold = 100.0 / lev  # 清算阈值百分比
        if abs(expected_loss_pct) >= threshold:
            liquidated += portion
    return round(liquidated, 2)


async def simulate_stress(
    shock_asset: str, shock_pct: float
) -> dict[str, Any]:
    """执行压力测试模拟。

    Args:
        shock_asset: 冲击资产（如 "BTC"）
        shock_pct: 冲击幅度百分比（如 -20.0 表示跌 20%）

    Returns:
        包含各资产预期损失、清算风险、总组合损失的字典。
    """
    shock_asset = shock_asset.upper()

    async with EvoQuantClient() as client:
        try:
            corr_data = await client.get_correlation_matrix()
            portfolio = await client.get_portfolio_risk()
        except EvoQuantAPIError as e:
            return {"error": f"数据获取失败: {e}"}

        # 获取各资产 OI
        oi_map: dict[str, dict[str, Any]] = {}
        symbols = corr_data.get("symbols", list(DEFAULT_BETAS.keys()))
        for sym in symbols:
            try:
                oi_map[sym] = await client.get_open_interest(sym)
            except EvoQuantAPIError:
                oi_map[sym] = {}

    # 解析相关性矩阵
    matrix = corr_data.get("matrix", {})
    shock_row = matrix.get(shock_asset, {})

    # 计算各资产预期损失
    asset_impacts: list[dict[str, Any]] = []
    total_portfolio_loss = 0.0
    total_liquidation_usd = 0.0
    weights = portfolio.get("weights", {})

    for sym in symbols:
        if sym == shock_asset:
            expected_loss = shock_pct
        else:
            corr = shock_row.get(sym, 0.5)
            beta = DEFAULT_BETAS.get(sym, 1.2)
            expected_loss = round(shock_pct * corr * beta, 2)

        liq_usd = _estimate_liquidation_usd(expected_loss, oi_map.get(sym, {}))
        total_liquidation_usd += liq_usd

        weight = weights.get(sym, 1.0 / max(len(symbols), 1))
        total_portfolio_loss += expected_loss * weight

        asset_impacts.append({
            "symbol": sym,
            "correlation_to_shock": shock_row.get(sym, 1.0 if sym == shock_asset else 0.5),
            "beta": DEFAULT_BETAS.get(sym, 1.2),
            "expected_loss_pct": expected_loss,
            "risk_level": _risk_level(expected_loss),
            "estimated_liquidation_usd": liq_usd,
        })

    # 按预期损失排序（最严重的在前）
    asset_impacts.sort(key=lambda x: x["expected_loss_pct"])

    # 级联风险评估
    critical_count = sum(1 for a in asset_impacts if a["risk_level"] == "critical")
    cascade_risk = "extreme" if critical_count >= 5 else (
        "high" if critical_count >= 3 else (
            "moderate" if critical_count >= 1 else "low"
        )
    )

    return {
        "shock_asset": shock_asset,
        "shock_pct": shock_pct,
        "asset_impacts": asset_impacts,
        "portfolio_summary": {
            "total_portfolio_loss_pct": round(total_portfolio_loss, 2),
            "total_estimated_liquidations_usd": round(total_liquidation_usd, 2),
            "assets_at_critical_risk": critical_count,
            "cascade_risk_level": cascade_risk,
        },
        "methodology": (
            "预期损失 = shock_pct * correlation * beta_adjustment; "
            "清算估算基于 OI 在 2x-20x 杠杆均匀分布假设"
        ),
    }
