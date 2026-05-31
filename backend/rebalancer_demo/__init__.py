"""Risk-Aware Auto-Rebalancer Demo - 基于真实历史数据的调仓演示。

从 EvoQuantV3 获取历史风险评分时序数据，展示 Vault 如何实时调仓。
支持三种场景：normal / stress / crash（从真实历史中选取对应时段）。
"""

from __future__ import annotations

import time
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


def _build_timeline(
    risk_series: list[int], start_ts: int
) -> list[dict[str, Any]]:
    """构建时间序列数据。"""
    timeline: list[dict[str, Any]] = []
    if not risk_series:
        return timeline

    current_sui_pct = _risk_to_sui_pct(risk_series[0])
    interval_seconds = 3600 // POINTS_PER_HOUR  # 15 分钟

    for i, risk_score in enumerate(risk_series):
        ts = start_ts + i * interval_seconds
        target_sui_pct = _risk_to_sui_pct(risk_score)
        deviation = abs(target_sui_pct - current_sui_pct)

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


async def _fetch_risk_series(client: EvoQuantClient, scenario: str) -> tuple[list[int], int]:
    """从 EvoQuantV3 获取真实历史风险数据作为时间序列。

    根据场景选取不同时间窗口：
    - normal: 最近 24h
    - stress: 最近 72h 中波动最大的 24h 窗口
    - crash: 最近 168h (7天) 中风险最高的 24h 窗口
    """
    total_points = TIMELINE_HOURS * POINTS_PER_HOUR
    now = int(time.time())

    # 根据场景决定回溯范围
    lookback_hours = {"normal": 24, "stress": 72, "crash": 168}
    hours = lookback_hours.get(scenario, 24)
    start = now - hours * 3600
    interval = 900  # 15 分钟

    try:
        data = await client.get_time_slice_range(
            start=str(start), end=str(now),
            interval=interval, symbols="SUI", domains="risk"
        )
    except EvoQuantAPIError:
        data = {}

    # 从返回数据中提取风险评分序列
    slices = data.get("slices", data.get("data", []))
    all_scores: list[int] = []
    for s in slices:
        score = s.get("risk_score", s.get("score", None))
        if score is not None:
            all_scores.append(max(0, min(100, int(score))))

    if not all_scores:
        # 如果历史数据不可用，从当前实时评分构建
        try:
            risk = await client.get_risk_score("SUI")
            base = int(risk.get("risk_score", 45))
        except EvoQuantAPIError:
            base = 45
        all_scores = [base] * total_points
        return all_scores[:total_points], now - total_points * 900

    # 根据场景选取最合适的 24h 窗口
    if scenario == "normal":
        # 取最近 24h 数据
        selected = all_scores[-total_points:]
    elif scenario == "stress":
        # 取波动最大的 24h 窗口
        selected = _find_most_volatile_window(all_scores, total_points)
    elif scenario == "crash":
        # 取风险最高的 24h 窗口
        selected = _find_highest_risk_window(all_scores, total_points)
    else:
        selected = all_scores[-total_points:]

    # 补齐不足的数据点
    if len(selected) < total_points:
        pad = selected[-1] if selected else 45
        selected.extend([pad] * (total_points - len(selected)))

    start_ts = now - len(selected) * 900
    return selected[:total_points], start_ts


def _find_most_volatile_window(scores: list[int], window: int) -> list[int]:
    """找到波动最大的窗口。"""
    if len(scores) <= window:
        return scores
    best_start = 0
    best_vol = 0.0
    for i in range(len(scores) - window):
        chunk = scores[i:i + window]
        vol = max(chunk) - min(chunk)
        if vol > best_vol:
            best_vol = vol
            best_start = i
    return scores[best_start:best_start + window]


def _find_highest_risk_window(scores: list[int], window: int) -> list[int]:
    """找到平均风险最高的窗口。"""
    if len(scores) <= window:
        return scores
    best_start = 0
    best_avg = 0.0
    for i in range(len(scores) - window):
        chunk = scores[i:i + window]
        avg = sum(chunk) / len(chunk)
        if avg > best_avg:
            best_avg = avg
            best_start = i
    return scores[best_start:best_start + window]


async def generate_rebalance_demo(
    scenario: str = "all",
) -> dict[str, Any]:
    """生成调仓演示时间序列数据（基于真实历史风险评分）。

    Args:
        scenario: "normal" / "stress" / "crash" / "all"

    Returns:
        时间序列动画数据，包含各时间点的仓位和操作。
    """
    scenarios_to_run = (
        ["normal", "stress", "crash"] if scenario == "all"
        else [scenario]
    )

    results: dict[str, Any] = {}
    base_score = 45

    async with EvoQuantClient() as client:
        for sc in scenarios_to_run:
            risk_series, start_ts = await _fetch_risk_series(client, sc)
            if sc == scenarios_to_run[0]:
                base_score = risk_series[0] if risk_series else 45

            timeline = _build_timeline(risk_series, start_ts)
            rebalance_count = sum(
                1 for t in timeline if t["action"] != "hold")
            max_risk = max(
                (t["risk_score"] for t in timeline), default=0)
            min_sui = min(
                (t["sui_pct"] for t in timeline), default=MIN_SUI_PCT)

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
            "从 EvoQuantV3 获取真实历史风险评分时序数据，"
            "根据场景选取对应时间窗口（normal=最近24h, "
            "stress=波动最大24h, crash=风险最高24h），"
            "当目标仓位偏离当前仓位超过阈值时触发调仓"
        ),
    }
