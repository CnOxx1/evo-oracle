"""跨资产风险传导引擎。

基于相关性矩阵、相对强弱、板块轮动数据，
构建资产间风险传导链路图，识别系统性风险聚集。
"""

from __future__ import annotations

from typing import Any


def build_contagion_map(
    correlation: dict[str, Any],
    relative_strength: dict[str, Any],
    sector_rotation: dict[str, Any],
    portfolio_risk: dict[str, Any],
) -> dict[str, Any]:
    """构建跨资产风险传导图。

    Returns:
        {
            nodes: [{symbol, sector, rs_rank, risk_contribution, momentum}],
            edges: [{source, target, correlation, risk_type}],
            clusters: [{sector, phase, avg_correlation, contagion_risk}],
            system_risk: {level, score, description}
        }
    """
    matrix = correlation.get("matrix", {})
    rs_data = relative_strength.get("data", [])
    sectors = sector_rotation.get("sectors", [])
    risk_contribs = portfolio_risk.get("risk_contributions", {})

    # 构建 RS 查找表
    rs_lookup: dict[str, dict] = {}
    for item in rs_data:
        rs_lookup[item["symbol"]] = item

    # ─── Nodes ───
    nodes = []
    for symbol, contrib in risk_contribs.items():
        rs_info = rs_lookup.get(symbol, {})
        nodes.append({
            "symbol": symbol.replace("/USDT", ""),
            "full_symbol": symbol,
            "sector": rs_info.get("sector", "unknown"),
            "rs_rank": rs_info.get("rs_rank", 0),
            "rs_momentum": rs_info.get("rs_momentum", "flat"),
            "risk_contribution": round(contrib, 6),
            "price_change_7d": rs_info.get("price_change_7d_pct", 0),
        })

    # ─── Edges（高相关性链路 > 0.7 或 < -0.7） ───
    edges = []
    seen = set()
    HIGH_CORR_THRESHOLD = 0.7

    for src_symbol, correlations in matrix.items():
        for tgt_symbol, corr_val in correlations.items():
            if src_symbol == tgt_symbol:
                continue
            pair_key = tuple(sorted([src_symbol, tgt_symbol]))
            if pair_key in seen:
                continue
            seen.add(pair_key)

            if abs(corr_val) >= HIGH_CORR_THRESHOLD:
                risk_type = "contagion" if corr_val > 0 else "hedge"
                edges.append({
                    "source": src_symbol.replace("/USDT", ""),
                    "target": tgt_symbol.replace("/USDT", ""),
                    "correlation": round(corr_val, 4),
                    "risk_type": risk_type,
                    "strength": "strong" if abs(corr_val) > 0.9 else "moderate",
                })

    # ─── Clusters（按板块聚合风险） ───
    clusters = []
    for sec in sectors:
        # 计算板块内资产的平均相关性
        sector_assets = [
            n["full_symbol"] for n in nodes if n["sector"] == sec["sector"]
        ]
        intra_corrs = []
        for i, a in enumerate(sector_assets):
            for b in sector_assets[i + 1:]:
                if a in matrix and b in matrix.get(a, {}):
                    intra_corrs.append(matrix[a][b])

        avg_intra_corr = (
            sum(intra_corrs) / len(intra_corrs) if intra_corrs else 0
        )

        # 传导风险 = 板块内相关性高 + 动量为负 → 容易级联下跌
        momentum = sec.get("sector_momentum_score", 0)
        contagion_score = max(0, avg_intra_corr) * (1 + max(0, -momentum) / 5)
        contagion_risk = (
            "high" if contagion_score > 0.8
            else "medium" if contagion_score > 0.4
            else "low"
        )

        clusters.append({
            "sector": sec["sector"],
            "phase": sec.get("rotation_phase", "unknown"),
            "momentum_score": round(momentum, 4),
            "return_7d": sec.get("sector_return_7d", 0),
            "volatility_7d": sec.get("sector_volatility_7d", 0),
            "avg_intra_correlation": round(avg_intra_corr, 4),
            "contagion_risk": contagion_risk,
            "contagion_score": round(contagion_score, 4),
            "asset_count": sec.get("constituent_count", 0),
        })

    # ─── System Risk（全局系统性风险评估） ───
    avg_corr = correlation.get("avg_correlation", 0)
    max_corr = correlation.get("max_correlation", 0)
    portfolio_vol = portfolio_risk.get("annualized_volatility", 0)
    var_95 = portfolio_risk.get("daily_var_95", 0)
    diversification = portfolio_risk.get("diversification_ratio", 1)

    # 系统性风险评分：相关性越高 + 波动率越大 + 分散化越低 = 风险越高
    sys_score = (
        (avg_corr * 30)
        + (portfolio_vol * 100)
        + (max(0, 3 - diversification) * 10)
        + (var_95 * 500)
    )
    sys_score = min(100, max(0, sys_score))

    if sys_score >= 70:
        sys_level, sys_desc = "critical", "系统性风险极高：资产高度相关，级联崩盘概率大"
    elif sys_score >= 50:
        sys_level, sys_desc = "high", "系统性风险偏高：板块联动明显，需警惕传导效应"
    elif sys_score >= 30:
        sys_level, sys_desc = "medium", "系统性风险中等：部分资产存在传导链路"
    else:
        sys_level, sys_desc = "low", "系统性风险低：资产分散化良好"

    system_risk = {
        "level": sys_level,
        "score": round(sys_score, 1),
        "description": sys_desc,
        "avg_correlation": round(avg_corr, 4),
        "max_correlation": round(max_corr, 4),
        "portfolio_volatility": round(portfolio_vol, 4),
        "diversification_ratio": round(diversification, 4),
        "daily_var_95": round(var_95, 6),
    }

    return {
        "nodes": sorted(nodes, key=lambda x: x["rs_rank"]),
        "edges": sorted(edges, key=lambda x: abs(x["correlation"]), reverse=True),
        "clusters": sorted(clusters, key=lambda x: x["contagion_score"], reverse=True),
        "system_risk": system_risk,
        "meta": {
            "total_assets": len(nodes),
            "high_corr_links": len([e for e in edges if e["risk_type"] == "contagion"]),
            "hedge_links": len([e for e in edges if e["risk_type"] == "hedge"]),
        },
    }
