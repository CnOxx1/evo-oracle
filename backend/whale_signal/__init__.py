"""鲸鱼风险信号引擎。

基于资金流向 + 相对强弱数据推断大资金动向，
待 EvoQuantV3 链上鲸鱼数据就绪后切换为真实数据源。
"""

from __future__ import annotations

from typing import Any


def compute_whale_signals(
    fund_flow: dict[str, Any],
    relative_strength: dict[str, Any],
    funding_all: dict[str, Any],
    portfolio_risk: dict[str, Any],
) -> dict[str, Any]:
    """推断鲸鱼行为信号。

    当前基于：
    - 资金流向（板块净流入/流出）→ 大资金方向
    - 相对强弱突变 → 异常买卖压力
    - 资金费率方向 → 杠杆仓位偏好

    待接入（EvoQuantV3 开发中）：
    - /onchain/whale-activity → 真实鲸鱼转账
    - /onchain/exchange-flow → 交易所充提
    """
    rs_data = relative_strength.get("data", [])
    flow_data = fund_flow.get("data", [])
    funding_rates = funding_all.get("funding_rates", {})
    risk_contribs = portfolio_risk.get("risk_contributions", {})

    # 构建资金费率查找表
    funding_lookup: dict[str, dict] = {}
    for symbol, data in funding_rates.items():
        funding_lookup[symbol] = data

    # ─── 逐资产鲸鱼信号推断 ───
    signals = []
    for item in rs_data:
        symbol = item["symbol"]
        asset = item.get("asset", symbol.replace("/USDT", ""))
        rs_7d = item.get("rs_vs_btc_7d", 0)
        rs_3d = item.get("rs_vs_btc_3d", 0)
        rs_1d = item.get("rs_vs_btc_1d", 0)
        momentum = item.get("rs_momentum", "flat")
        price_chg = item.get("price_change_7d_pct", 0)

        funding = funding_lookup.get(symbol, {})
        avg_rate = funding.get("avg_rate", 0)
        risk_contrib = risk_contribs.get(symbol, 0)

        # ─── 鲸鱼行为推断逻辑 ───
        # RS 突变 = 异常买卖压力（可能是鲸鱼）
        rs_divergence = abs(rs_1d - rs_7d)
        # 资金费率方向 = 杠杆偏好
        funding_bias = "long_heavy" if avg_rate > 0.0002 else "short_heavy" if avg_rate < -0.0002 else "neutral"

        # 综合鲸鱼信号强度
        signal_strength = min(100, rs_divergence * 10 + abs(avg_rate) * 50000)

        # 判断鲸鱼行为方向
        if rs_1d > rs_3d > 0 and avg_rate > 0:
            whale_action = "accumulating"
            direction = "bullish"
        elif rs_1d < rs_3d < 0 and avg_rate < 0:
            whale_action = "distributing"
            direction = "bearish"
        elif rs_divergence > 3:
            whale_action = "repositioning"
            direction = "uncertain"
        else:
            whale_action = "inactive"
            direction = "neutral"

        signals.append({
            "symbol": asset,
            "full_symbol": symbol,
            "whale_action": whale_action,
            "direction": direction,
            "signal_strength": round(signal_strength, 1),
            "rs_momentum": momentum,
            "rs_7d": round(rs_7d, 4),
            "rs_1d": round(rs_1d, 4),
            "funding_bias": funding_bias,
            "funding_rate": round(avg_rate, 6),
            "risk_contribution": round(risk_contrib, 6),
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
        "data_source": "relative_strength_proxy",
        "pending_upgrade": [
            "/onchain/whale-activity — 真实鲸鱼转账记录",
            "/onchain/exchange-flow — 交易所充提净流量",
        ],
    }
