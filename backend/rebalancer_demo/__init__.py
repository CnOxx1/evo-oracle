"""Risk-Aware Auto-Rebalancer Demo - 实时调仓演示。

模拟 Oracle 信号变化时 Vault 如何实时调仓，
输出时间序列动画数据（三种场景：normal / stress / crash）。
"""

from __future__ import annotations

import time
import math
import random
from typing import Any

from api_client.client import EvoQuantClient, EvoQuantAPIError


# ---- 调仓参数 ----
REBALANCE_THRESHOLD = 5  # 仓位偏离 > 5% 才触发调仓
MIN_SUI_PCT = 5
MAX_SUI_PCT = 85
TIMELINE_HOURS = 24
POINTS_PER_HOUR = 4  # 每小时 4 个数据点（15 分钟间隔）


def _risk_to_sui_pct(risk_score: int) -> int:
    """风险评分 → 目标 SUI 仓位百分比。"""
    return max(MIN_SUI_PCT, min(MAX_SUI_PCT, int(85 - risk_score * 0.8)))


def _generate_risk_series(
    base_score: int, scenario: str
) -> list[int]:
    """生成模拟风险信号时间序列。

    Args:
        base_score: 当前真实风险评分（起始点）
        scenario: normal / stress / crash
    """
    total_points = TIMELINE_HOURS * POINTS_PER_HOUR
    series: list[int] = []
    score = float(base_score)
    random.seed(42)  # 可复现

    for i in range(total_points):
        progress = i / total_points

        if scenario == "normal":
            # 平稳波动：在 base_score 附近 +/- 10
            noise = random.gauss(0, 3)
            drift = math.sin(progress * math.pi * 4) * 5
            score = base_score + drift + noise

        elif scenario == "stress":
            # 压力场景：前半段缓慢上升，后半段高位震荡
            if progress < 0.4:
                score += random.gauss(0.5, 0.8)
            elif progress < 0.7:
                score += random.gauss(0.8, 1.2)
            else:
                score += random.gauss(-0.3, 1.5)

        elif scenario == "crash":
            # 崩盘场景：快速飙升到极端值
            if progress < 0.2:
                score += random.gauss(0.3, 0.5)
            elif progress < 0.4:
                score += random.gauss(2.5, 1.0)
            elif progress < 0.6:
                score += random.gauss(1.5, 0.8)
            else:
                score += random.gauss(-1.0, 1.5)

        series.append(max(0, min(100, int(score))))

    return series


def _build_timeline(
    base_score: int, scenario: str, start_ts: int
) -> list[dict[str, Any]]:
    """构建单个场景的时间序列数据。"""
    risk_series = _generate_risk_series(base_score, scenario)
    timeline: list[dict[str, Any]] = []
    current_sui_pct = _risk_to_sui_pct(base_score)
    interval_seconds = 3600 // POINTS_PER_HOUR  # 15 分钟

    for i, risk_score in enumerate(risk_series):
        ts = start_ts + i * interval_seconds
        target_sui_pct = _risk_to_sui_pct(risk_score)
        deviation = abs(target_sui_pct - current_sui_pct)

        # 判断是否触发调仓
        action = "hold"
        trigger = None
        if deviation >= REBALANCE_THRESHOLD:
            if target_sui_pct < current_sui_pct:
                action = "reduce_sui"
                trigger = f"风险升至{risk_score}，减仓SUI {deviation}%"
            else:
                action = "increase_sui"
                trigger = f"风险降至{risk_score}，加仓SUI {deviation}%"
            current_sui_pct = target_sui_pct

        timeline.append({
            "timestamp": ts,
            "time_offset_min": i * (60 // POINTS_PER_HOUR),
            "risk_score": risk_score,
            "sui_pct": current_sui_pct,
            "usdc_pct": 100 - current_sui_pct,
            "action": action,
            "trigger": trigger,
        })

    return timeline


async def generate_rebalance_demo(
    scenario: str = "all",
) -> dict[str, Any]:
    """生成调仓演示时间序列数据。

    Args:
        scenario: "normal" / "stress" / "crash" / "all"

    Returns:
        时间序列动画数据，包含各时间点的仓位和操作。
    """
    # 获取当前真实风险评分作为起始点
    async with EvoQuantClient() as client:
        try:
            portfolio = await client.get_portfolio_risk()
        except EvoQuantAPIError:
            portfolio = {}

    # 从组合风险数据推断当前风险评分
    ann_vol = portfolio.get("annualized_volatility", 0.5)
    var_95 = abs(portfolio.get("var_95", 0.03))
    # 将波动率和 VaR 映射到 0-100 风险评分
    base_score = int(min(ann_vol * 80 + var_95 * 500, 100))
    base_score = max(20, min(80, base_score))  # 合理范围

    start_ts = int(time.time())
    scenarios_to_run = (
        ["normal", "stress", "crash"] if scenario == "all"
        else [scenario]
    )

    results: dict[str, Any] = {}
    for sc in scenarios_to_run:
        timeline = _build_timeline(base_score, sc, start_ts)
        rebalance_count = sum(1 for t in timeline if t["action"] != "hold")
        max_risk = max(t["risk_score"] for t in timeline)
        min_sui = min(t["sui_pct"] for t in timeline)

        results[sc] = {
            "timeline": timeline,
            "stats": {
                "total_points": len(timeline),
                "rebalance_count": rebalance_count,
                "max_risk_score": max_risk,
                "min_sui_exposure_pct": min_sui,
                "max_usdc_pct": 100 - min_sui,
                "duration_hours": TIMELINE_HOURS,
                "interval_minutes": 60 // POINTS_PER_HOUR,
            },
        }

    return {
        "base_risk_score": base_score,
        "base_sui_pct": _risk_to_sui_pct(base_score),
        "scenarios": results,
        "config": {
            "rebalance_threshold_pct": REBALANCE_THRESHOLD,
            "min_sui_pct": MIN_SUI_PCT,
            "max_sui_pct": MAX_SUI_PCT,
        },
        "methodology": (
            "从当前真实风险评分出发，模拟未来24h三种场景的风险变化，"
            "当目标仓位偏离当前仓位超过阈值时触发调仓"
        ),
    }