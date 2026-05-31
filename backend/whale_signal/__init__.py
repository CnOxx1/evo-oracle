"""鲸鱼风险信号引擎。

基于 EvoQuantV3 /onchain/whale-activity 真实数据 + 相对强弱 + 资金费率
综合推断大资金动向。
"""

from __future__ import annotations

from typing import Any

from api_client.client import EvoQuantClient, EvoQuantAPIError


async def compute_whale_signals_async() -> dict[str, Any]:
    """从 EvoQuantV3 拉取真实鲸鱼活动数据 + RS + 资金费率，综合推断。"""
    async with EvoQuantClient() as client:
        try:
            rs_data_raw = await client.get_relative_strength()
            funding_all = await client.get_funding_all()
        except EvoQuantAPIError as e:
            return {"error": f"数据获取失败: {e}"}

        # 获取各资产鲸鱼活动数据
        rs_data = rs_data_raw.get("data", [])
        funding_rates = funding_all.get("funding_rates", {})
        symbols = [item.get("asset", item["symbol"].replace("/USDT", ""))
                   for item in rs_data]

        whale_map: dict[str, dict[str, Any]] = {}
        for sym in symbols:
            try:
                whale_map[sym] = await client.get_whale_activity(sym)
            except EvoQuantAPIError:
                whale_map[sym] = {}

    # 构建资金费率查找表
    funding_lookup: dict[str, dict] = {}
    for symbol, data in funding_rates.items():
        clean = symbol.replace("/USDT", "").replace("USDT", "")
        funding_lookup[clean] = data

    # ─── 逐资产鲸鱼信号推断 ───
    signals = []
    for item in rs_data:
        symbol = item["symbol"]
        asset = item.get("asset", symbol.replace("/USDT", ""))
        rs_7d = item.get("rs_vs_btc_7d", 0)
        rs_1d = item.get("rs_vs_btc_1d", 0)
        momentum = item.get("rs_momentum", "flat")
        price_chg = item.get("price_change_7d_pct", 0)

        # 真实鲸鱼活动数据
        whale_data = whale_map.get(asset, {})
        activity_score = whale_data.get("activity_score", 0)
        whale_signal_raw = whale_data.get("whale_signal", "unknown")
        volume_spike = whale_data.get("volume_spike", False)
        price_move_6h = whale_data.get("price_move_6h_pct", 0)
        oi_change_24h = whale_data.get("oi_change_24h", 0)

        # 资金费率
        funding = funding_lookup.get(asset, {})
        avg_rate = funding.get("rate", funding.get("avg_rate", 0))
        funding_bias = (
            "long_heavy" if avg_rate > 0.0002
            else "short_heavy" if avg_rate < -0.0002
            else "neutral"
        )

        # 综合信号强度：真实 activity_score + RS 偏离 + 资金费率
        rs_divergence = abs(rs_1d - rs_7d)
        signal_strength = min(100, activity_score * 0.6
                              + rs_divergence * 8
                              + abs(avg_rate) * 30000)

        # 判断鲸鱼行为方向（结合真实数据）
        if activity_score >= 50 and price_move_6h > 1 and avg_rate > 0:
            whale_action = "accumulating"
            direction = "bullish"
        elif activity_score >= 50 and price_move_6h < -1 and avg_rate < 0:
            whale_action = "distributing"
            direction = "bearish"
        elif activity_score >= 40 or volume_spike:
            whale_action = "repositioning"
            direction = "uncertain"
        elif rs_divergence > 3:
            whale_action = "repositioning"
            direction = "uncertain"
        else:
            whale_action = "inactive"
            direction = "neutral"

        signals.append({
            "symbol": asset,
            "whale_action": whale_action,
            "direction": direction,
            "signal_strength": round(signal_strength, 1),
            "activity_score": activity_score,
            "whale_signal_raw": whale_signal_raw,
            "volume_spike": volume_spike,
            "price_move_6h": price_move_6h,
            "oi_change_24h": oi_change_24h,
            "rs_momentum": momentum,
            "rs_7d": round(rs_7d, 4),
            "rs_1d": round(rs_1d, 4),
            "funding_bias": funding_bias,
            "funding_rate": round(avg_rate, 6),
            "price_change_7d": price_chg,
        })

    # 按信号强度排序
    signals.sort(key=lambda x: x["signal_strength"], reverse=True)

    # 全局鲸鱼活动摘要
    active_count = sum(1 for s in signals if s["whale_action"] != "inactive")
    accumulating = [s for s in signals if s["whale_action"] == "accumulating"]
    distributing = [s for s in signals if s["whale_action"] == "distributing"]

    if len(distributing) > len(accumulating) * 2:
        market_whale_bias = "distribution"
        risk_implication = "鲸鱼大规模派发，短期下行风险增加"
    elif len(accumulating) > len(distributing) * 2:
        market_whale_bias = "accumulation"
        risk_implication = "鲸鱼积极吸筹，中期看涨信号"
    else:
        market_whale_bias = "mixed"
        risk_implication = "鲸鱼行为分化，市场方向不明"

    return {
        "market_whale_bias": market_whale_bias,
        "risk_implication": risk_implication,
        "active_whale_count": active_count,
        "total_assets": len(signals),
        "accumulating_count": len(accumulating),
        "distributing_count": len(distributing),
        "signals": signals,
        "top_accumulating": accumulating[:3],
        "top_distributing": distributing[:3],
        "data_source": "evoquantv3_whale_activity",
    }