"""清算瀑布模拟器 — 模拟连锁清算过程。"""

from __future__ import annotations
import random
from typing import Any


def simulate_cascade(
    shock_asset: str,
    shock_pct: float,
    correlation_matrix: dict[str, Any],
    funding_data: dict[str, Any],
    oi_data: dict[str, Any],
) -> dict[str, Any]:
    """模拟清算瀑布。"""
    shock_pct = abs(shock_pct)
    assets = list(correlation_matrix.get("symbols", ["BTC", "ETH", "SUI"]))
    if shock_asset not in assets:
        assets.append(shock_asset)

    positions = _generate_positions(assets, funding_data, oi_data)
    timeline: list[dict[str, Any]] = []
    cumulative_sell_pressure = 0.0
    remaining_positions = list(positions)
    current_drops: dict[str, float] = {shock_asset: shock_pct}

    corr_data = correlation_matrix.get("correlation_matrix", {})
    for asset in assets:
        if asset == shock_asset:
            continue
        corr = _get_correlation(corr_data, shock_asset, asset)
        current_drops[asset] = shock_pct * corr * 0.8

    for round_num in range(1, 6):
        liquidated_this_round: list[dict[str, Any]] = []
        sell_pressure_round = 0.0
        new_remaining = []

        for pos in remaining_positions:
            asset_drop = current_drops.get(pos["asset"], 0)
            if asset_drop >= pos["liquidation_threshold"]:
                liquidated_this_round.append({
                    "asset": pos["asset"],
                    "size_usd": pos["size_usd"],
                    "leverage": pos["leverage"],
                    "liquidation_price_drop": pos["liquidation_threshold"],
                })
                sell_pressure_round += pos["size_usd"]
            else:
                new_remaining.append(pos)

        remaining_positions = new_remaining
        if not liquidated_this_round:
            break

        cumulative_sell_pressure += sell_pressure_round
        timeline.append({
            "round": round_num,
            "liquidated_count": len(liquidated_this_round),
            "sell_pressure_usd": round(sell_pressure_round, 0),
            "cumulative_sell_pressure_usd": round(cumulative_sell_pressure, 0),
            "positions": liquidated_this_round,
            "price_impact_pct": round(sell_pressure_round / 1_000_000 * 0.5, 2),
        })

        for asset in assets:
            additional_drop = sell_pressure_round / 5_000_000 * 1.5
            current_drops[asset] = current_drops.get(asset, 0) + additional_drop

    total_liquidated = sum(r["liquidated_count"] for r in timeline)
    return {
        "shock_asset": shock_asset,
        "shock_pct": shock_pct,
        "total_rounds": len(timeline),
        "total_liquidated_positions": total_liquidated,
        "total_sell_pressure_usd": round(cumulative_sell_pressure, 0),
        "cascade_severity": (
            "critical" if total_liquidated > 15 else
            "high" if total_liquidated > 8 else
            "medium" if total_liquidated > 3 else "low"
        ),
        "timeline": timeline,
        "surviving_positions": len(remaining_positions),
    }


def _generate_positions(assets: list[str], funding_data: dict[str, Any], oi_data: dict[str, Any]) -> list[dict[str, Any]]:
    random.seed(42)
    positions = []
    leverage_tiers = [2, 3, 5, 10, 20, 50]
    for asset in assets:
        for _ in range(random.randint(3, 8)):
            leverage = random.choice(leverage_tiers)
            size = random.uniform(50_000, 2_000_000)
            liq_threshold = (1 / leverage) * 80
            positions.append({
                "asset": asset,
                "leverage": leverage,
                "size_usd": round(size, 0),
                "liquidation_threshold": round(liq_threshold, 1),
            })
    return positions


def _get_correlation(corr_data: dict, asset_a: str, asset_b: str) -> float:
    if isinstance(corr_data, dict):
        row = corr_data.get(asset_a, {})
        if isinstance(row, dict):
            return abs(row.get(asset_b, 0.5))
    return 0.5
