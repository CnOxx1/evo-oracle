"""Predictive Liquidation Alert - 预测性清算告警。

基于 OI 堆积速度 + 资金费率方向 + 相关性集中度 + 波动率，
预测未来 4h 清算概率。
"""

from __future__ import annotations

import math
from typing import Any

from api_client.client import EvoQuantClient, EvoQuantAPIError


# 各因子权重
WEIGHT_OI_SPEED = 0.30
WEIGHT_FUNDING_DIR = 0.25
WEIGHT_CORR_CONCENTRATION = 0.20
WEIGHT_VOLATILITY = 0.25

# 阈值
FUNDING_EXTREME_THRESHOLD = 0.05  # 年化 > 5% 视为极端
OI_CHANGE_HIGH = 15.0  # 24h OI 变化 > 15% 视为高速堆积


def _sigmoid(x: float) -> float:
    """将任意值映射到 0-1 区间。"""
    return 1.0 / (1.0 + math.exp(-x))


def _oi_speed_score(oi_data: dict[str, Any]) -> float:
    """OI 增速因子：24h 变化率越大 → 新杠杆越多 → 清算风险越高。"""
    change_24h = oi_data.get("open_interest_change_24h", 0)
    # 归一化到 0-100
    normalized = min(abs(change_24h) / OI_CHANGE_HIGH * 100, 100)
    return normalized


def _funding_direction_score(funding_rate: float) -> float:
    """资金费率方向因子：极端正/负 → 单边拥挤 → 清算风险高。"""
    # 年化资金费率
    annualized = abs(funding_rate) * 3 * 365  # 8h 费率 → 年化
    score = min(annualized / FUNDING_EXTREME_THRESHOLD * 100, 100)
    return score


def _correlation_concentration_score(
    symbol: str, matrix: dict[str, Any]
) -> float:
    """相关性集中度因子：与多资产高相关 → 级联放大风险。"""
    row = matrix.get(symbol, {})
    if not row:
        return 50.0  # 默认中等
    # 计算平均绝对相关系数（排除自身）
    correlations = [abs(v) for k, v in row.items() if k != symbol]
    if not correlations:
        return 50.0
    avg_corr = sum(correlations) / len(correlations)
    # 高相关集中度 → 高分
    high_corr_count = sum(1 for c in correlations if c > 0.7)
    score = avg_corr * 60 + (high_corr_count / max(len(correlations), 1)) * 40
    return min(score * 100, 100)


def _volatility_score(portfolio: dict[str, Any], symbol: str) -> float:
    """波动率因子：高波动 → 触发清算概率高。"""
    ann_vol = portfolio.get("annualized_volatility", 0.5)
    # 个别资产的风险贡献
    contributions = portfolio.get("risk_contributions", {})
    asset_contrib = contributions.get(symbol, ann_vol)
    # 归一化：年化波动率 > 100% 视为极端
    score = min(abs(asset_contrib) * 100, 100)
    return score


def _alert_level(probability: float) -> str:
    """根据清算概率判断预警等级。"""
    if probability >= 75:
        return "critical"
    elif probability >= 50:
        return "high"
    elif probability >= 25:
        return "medium"
    return "low"


async def predict_liquidations() -> dict[str, Any]:
    """预测未来 4h 各资产清算概率。

    Returns:
        逐资产清算概率 + 全局级联概率 + 预警等级。
    """
    async with EvoQuantClient() as client:
        try:
            funding_data = await client.get_funding_all()
            corr_data = await client.get_correlation_matrix()
            portfolio = await client.get_portfolio_risk()
        except EvoQuantAPIError as e:
            return {"error": f"数据获取失败: {e}"}

        # 获取各资产 OI
        funding_rates = funding_data.get("funding_rates", {})
        symbols = list(funding_rates.keys())
        oi_map: dict[str, dict[str, Any]] = {}
        for sym in symbols:
            clean_sym = sym.replace("/USDT", "").replace("USDT", "")
            try:
                oi_map[sym] = await client.get_open_interest(clean_sym)
            except EvoQuantAPIError:
                oi_map[sym] = {}

    matrix = corr_data.get("matrix", {})
    asset_predictions: list[dict[str, Any]] = []
    probabilities: list[float] = []

    for sym in symbols:
        clean_sym = sym.replace("/USDT", "").replace("USDT", "")
        funding_rate = funding_rates.get(sym, {}).get("rate", 0)
        oi_data = oi_map.get(sym, {})

        # 计算四个因子分数
        oi_score = _oi_speed_score(oi_data)
        funding_score = _funding_direction_score(funding_rate)
        corr_score = _correlation_concentration_score(clean_sym, matrix)
        vol_score = _volatility_score(portfolio, clean_sym)

        # 加权综合概率
        raw_prob = (
            oi_score * WEIGHT_OI_SPEED
            + funding_score * WEIGHT_FUNDING_DIR
            + corr_score * WEIGHT_CORR_CONCENTRATION
            + vol_score * WEIGHT_VOLATILITY
        )
        # 用 sigmoid 平滑到合理区间，避免极端值
        probability = round(
            _sigmoid((raw_prob - 50) / 15) * 100, 1
        )
        probabilities.append(probability)

        asset_predictions.append({
            "symbol": clean_sym,
            "liquidation_probability_4h": probability,
            "alert_level": _alert_level(probability),
            "factors": {
                "oi_speed": round(oi_score, 1),
                "funding_direction": round(funding_score, 1),
                "correlation_concentration": round(corr_score, 1),
                "volatility": round(vol_score, 1),
            },
            "funding_rate": funding_rate,
            "oi_change_24h": oi_data.get("open_interest_change_24h", 0),
        })

    # 按清算概率排序
    asset_predictions.sort(
        key=lambda x: x["liquidation_probability_4h"], reverse=True
    )

    # 全局级联概率：如果多个高概率资产高度相关，级联风险放大
    high_prob_assets = [a for a in asset_predictions if a["liquidation_probability_4h"] > 50]
    cascade_multiplier = 1.0 + len(high_prob_assets) * 0.1
    global_cascade_prob = round(
        min((sum(probabilities) / max(len(probabilities), 1)) * cascade_multiplier, 100), 1
    )

    return {
        "prediction_horizon": "4h",
        "asset_predictions": asset_predictions,
        "global_cascade": {
            "cascade_probability": global_cascade_prob,
            "alert_level": _alert_level(global_cascade_prob),
            "high_risk_asset_count": len(high_prob_assets),
            "cascade_multiplier": round(cascade_multiplier, 2),
        },
        "methodology": (
            "综合 OI增速(30%) + 资金费率方向(25%) + "
            "相关性集中度(20%) + 波动率(25%) 四因子加权"
        ),
    }
