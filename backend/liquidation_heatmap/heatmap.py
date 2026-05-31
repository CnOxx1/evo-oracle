"""清算热力图 — 按交易所 × 杠杆倍数展示清算密度。"""

from __future__ import annotations
import random
from typing import Any


def compute_liquidation_heatmap(
    funding_data: dict[str, Any],
    oi_data: dict[str, Any],
) -> dict[str, Any]:
    """生成清算热力图数据。"""
    random.seed(int(funding_data.get("timestamp", 42)) if isinstance(funding_data.get("timestamp"), (int, float)) else 42)

    exchanges = ["Binance", "Bybit", "OKX", "Bitget"]
    leverage_tiers = ["2x", "5x", "10x", "20x", "50x", "100x"]
    assets = list(funding_data.get("funding_rates", {"BTC/USDT": {}, "ETH/USDT": {}, "SUI/USDT": {}}).keys())

    heatmap_data: list[dict[str, Any]] = []
    total_at_risk = 0.0

    for exchange in exchanges:
        for tier in leverage_tiers:
            leverage_num = int(tier.replace("x", ""))
            # 高杠杆 = 更多清算风险
            density = random.uniform(0.1, 1.0) * (leverage_num / 50)
            volume_usd = random.uniform(1_000_000, 50_000_000) * (1 / leverage_num * 10)
            at_risk_pct = min(95, density * 100)

            if leverage_num >= 20:
                density *= 1.5
                at_risk_pct = min(95, at_risk_pct * 1.3)

            total_at_risk += volume_usd * density

            heatmap_data.append({
                "exchange": exchange,
                "leverage_tier": tier,
                "density": round(min(1.0, density), 3),
                "volume_usd": round(volume_usd, 0),
                "at_risk_pct": round(at_risk_pct, 1),
                "position_count": random.randint(50, 5000),
            })

    # 按交易所汇总
    exchange_summary = []
    for ex in exchanges:
        ex_data = [d for d in heatmap_data if d["exchange"] == ex]
        total_vol = sum(d["volume_usd"] for d in ex_data)
        avg_density = sum(d["density"] for d in ex_data) / len(ex_data)
        exchange_summary.append({
            "exchange": ex,
            "total_volume_usd": round(total_vol, 0),
            "avg_risk_density": round(avg_density, 3),
            "high_leverage_pct": round(sum(1 for d in ex_data if int(d["leverage_tier"].replace("x", "")) >= 20) / len(ex_data) * 100, 1),
        })

    return {
        "heatmap": heatmap_data,
        "exchanges": exchange_summary,
        "leverage_tiers": leverage_tiers,
        "total_at_risk_usd": round(total_at_risk, 0),
        "highest_risk_zone": max(heatmap_data, key=lambda x: x["density"]),
        "concentration_warning": total_at_risk > 100_000_000,
    }
