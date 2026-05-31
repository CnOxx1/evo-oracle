"""EvoOracle 前端 API 服务。

前后端分离的后端出口：聚合 EvoQuantV3 数据，输出前端友好结构。
前端只与本服务 + Sui 链交互，不直接访问数据基座。
"""

from __future__ import annotations

import argparse
import time
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from alert_engine.engine import detect_alerts
from api_client.client import EvoQuantAPIError, EvoQuantClient
from config.settings import settings
from risk_composer.composer import compose_risk
from signal_processor.processor import build_oracle_payload

app = FastAPI(
    title="EvoOracle API",
    description="前端聚合 API —— Sui DeFi 风险引擎",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

_cache: dict[str, tuple[float, Any]] = {}


def _cache_get(key: str) -> Any | None:
    item = _cache.get(key)
    if item and (time.time() - item[0]) < settings.cache_ttl_seconds:
        return item[1]
    return None


def _cache_set(key: str, value: Any) -> None:
    _cache[key] = (time.time(), value)


@app.get("/api/health")
async def health() -> dict[str, Any]:
    async with EvoQuantClient() as client:
        try:
            upstream = await client.get_health()
            upstream_ok = upstream.get("status") == "healthy"
        except EvoQuantAPIError:
            upstream, upstream_ok = {}, False
    return {
        "evo_oracle": "ok",
        "evoquant_healthy": upstream_ok,
        "evoquant_status": upstream.get("status", "unreachable"),
    }


@app.get("/api/overview")
async def overview() -> dict[str, Any]:
    """全局风险概览：一键看系统状态，Demo 首页用。"""
    async with EvoQuantClient() as client:
        try:
            portfolio = await client.get_portfolio_risk()
            macro = await client.get_macro_regime()
            funding = await client.get_funding_all()
        except EvoQuantAPIError:
            return {
                "system_risk_score": 50,
                "system_risk_level": "medium",
                "macro_stance": "neutral",
                "portfolio_var_95": 0,
                "high_risk_asset_count": 0,
                "total_tracked_assets": len(settings.tracked_symbols),
                "active_alerts": 0,
                "data_source_status": "offline",
            }

    # 系统风险评分：基于组合波动率 + VaR
    ann_vol = portfolio.get("annualized_volatility", 0.5)
    var_95 = abs(portfolio.get("var_95", 0.03))
    system_score = int(min(ann_vol * 60 + var_95 * 800, 100))

    # 高风险资产计数（资金费率极端）
    rates = funding.get("funding_rates", {})
    high_risk_count = sum(
        1 for v in rates.values()
        if abs(v.get("rate", 0)) * 3 * 365 > 0.05
    )

    # 告警数
    try:
        alert_data = await alerts_all()
        alert_count = alert_data.get("alert_count", 0)
    except Exception:
        alert_count = 0

    level = (
        "critical" if system_score >= 75 else
        "high" if system_score >= 55 else
        "medium" if system_score >= 35 else
        "low"
    )

    return {
        "system_risk_score": system_score,
        "system_risk_level": level,
        "macro_stance": macro.get("overall_stance", "neutral"),
        "portfolio_var_95": round(var_95 * 100, 2),
        "annualized_volatility": round(ann_vol * 100, 1),
        "high_risk_asset_count": high_risk_count,
        "total_tracked_assets": len(rates),
        "active_alerts": alert_count,
        "data_source_status": "online",
    }


@app.get("/api/oracle/{symbol}")
async def oracle_symbol(symbol: str) -> dict[str, Any]:
    """单资产链上信号视图：原始信号 + 转换后的链上 payload。"""
    cache_key = f"oracle:{symbol.upper()}"
    if (cached := _cache_get(cache_key)) is not None:
        return cached

    async with EvoQuantClient() as client:
        try:
            signal = await client.get_signal(symbol)
            risk = await client.get_risk_score(symbol)
            macro = await client.get_macro_regime()
        except EvoQuantAPIError as e:
            raise HTTPException(status_code=502, detail=f"EvoQuantV3 不可用: {e}")

    payload = build_oracle_payload(signal, risk, macro)
    result = {
        "symbol": payload["symbol"],
        "onchain_payload": payload,
        "trend_signal": signal.get("trend_signal"),
        "volatility": signal.get("volatility"),
        "funding_anomaly": signal.get("funding_anomaly"),
        "risk_level": risk.get("risk_level"),
        "risk_score": risk.get("risk_score"),
        "macro_stance": macro.get("overall_stance"),
        "generated_at": signal.get("generated_at"),
    }
    _cache_set(cache_key, result)
    return result


@app.get("/api/oracle")
async def oracle_all() -> dict[str, Any]:
    """全部 tracked 资产的信号摘要。"""
    results: dict[str, Any] = {}
    for symbol in settings.tracked_symbols:
        try:
            results[symbol] = await oracle_symbol(symbol)
        except HTTPException:
            results[symbol] = {"error": "unavailable"}
    return {"symbol_count": len(results), "oracles": results}


@app.get("/api/risk-breakdown/{symbol}")
async def risk_breakdown(symbol: str) -> dict[str, Any]:
    """可解释风险评分：综合分 + 各证据链贡献明细。"""
    cache_key = f"breakdown:{symbol.upper()}"
    if (cached := _cache_get(cache_key)) is not None:
        return cached

    async with EvoQuantClient() as client:
        try:
            signal = await client.get_signal(symbol)
            macro = await client.get_macro_regime()
            sentiment = await client.get_sentiment_summary()
        except EvoQuantAPIError as e:
            raise HTTPException(status_code=502, detail=f"EvoQuantV3 不可用: {e}")

    result = compose_risk(signal, macro, sentiment)
    _cache_set(cache_key, result)
    return result


@app.get("/api/alerts/{symbol}")
async def alerts_symbol(symbol: str) -> dict[str, Any]:
    """单资产异常告警列表。"""
    async with EvoQuantClient() as client:
        try:
            signal = await client.get_signal(symbol)
            macro = await client.get_macro_regime()
            sentiment = await client.get_sentiment_summary()
        except EvoQuantAPIError as e:
            raise HTTPException(status_code=502, detail=f"EvoQuantV3 不可用: {e}")

    composite = compose_risk(signal, macro, sentiment)
    return detect_alerts(signal, composite, macro, sentiment)


@app.get("/api/alerts")
async def alerts_all() -> dict[str, Any]:
    """全部 tracked 资产的告警汇总（Dashboard 告警流）。"""
    feed: list[dict[str, Any]] = []
    for symbol in settings.tracked_symbols:
        try:
            result = await alerts_symbol(symbol)
            for a in result.get("alerts", []):
                feed.append({**a, "symbol": result.get("symbol", symbol)})
        except HTTPException:
            continue
    severity_rank = {"critical": 2, "warning": 1, "info": 0}
    feed.sort(key=lambda x: severity_rank.get(x.get("severity", "info"), 0), reverse=True)
    return {"alert_count": len(feed), "alerts": feed}


@app.get("/api/vault/state")
async def vault_state() -> dict[str, Any]:
    """Vault 当前状态 + Protected/Static 对比。

    基于当前风险评分动态仓位配置。
    高风险 → 降低 SUI 敞口，增加 USDC 避险。
    """
    # 获取当前综合风险评分来决定仓位
    async with EvoQuantClient() as client:
        try:
            risk = await client.get_risk_score(settings.tracked_symbols[0])
            score = risk.get("risk_score", 50)
        except EvoQuantAPIError as e:
            raise HTTPException(status_code=502, detail=f"EvoQuantV3 不可用: {e}")

    # 动态仓位：风险越高，SUI 占比越低
    sui_pct = max(10, 80 - score)
    usdc_pct = 100 - sui_pct
    # PnL：Protected 策略在高风险时减仓保护
    protected_pnl = round(-(score * 0.05), 1)
    static_pnl = round(-(score * 0.12), 1)

    return {
        "status": "live",
        "risk_score_used": score,
        "protected": {"sui_pct": sui_pct, "usdc_pct": usdc_pct, "pnl_7d": protected_pnl},
        "static": {"sui_pct": 50, "usdc_pct": 50, "pnl_7d": static_pnl},
    }


@app.get("/api/backtest/luna")
async def backtest_luna(
    exit_threshold: int = 70,
    reduce_threshold: int = 50,
    initial_exposure: int = 100,
) -> dict[str, Any]:
    """LUNA 崩盘期间交互式回测。

    支持参数化模拟：用户可调风险阈值，实时对比保护效果。

    Query params:
        exit_threshold: 触发全退出的风险阈值 (0-100, default 70)
        reduce_threshold: 触发减仓的风险阈值 (0-100, default 50)
        initial_exposure: 初始仓位百分比 (0-100, default 100)
    """
    from server.luna_backtest import simulate_backtest

    # 参数范围校验
    exit_threshold = max(0, min(100, exit_threshold))
    reduce_threshold = max(0, min(100, reduce_threshold))
    initial_exposure = max(10, min(100, initial_exposure))

    result = simulate_backtest(exit_threshold, reduce_threshold, initial_exposure)
    return {"status": "complete", **result}


@app.get("/api/contagion-map")
async def contagion_map() -> dict[str, Any]:
    """跨资产风险传导图：相关性矩阵 + 板块轮动 + 组合风险。"""
    cache_key = "contagion_map"
    if (cached := _cache_get(cache_key)) is not None:
        return cached

    from contagion_engine import build_contagion_map

    async with EvoQuantClient() as client:
        try:
            correlation = await client.get_correlation_matrix()
            rs = await client.get_relative_strength()
            sector = await client.get_sector_rotation()
            portfolio = await client.get_portfolio_risk()
        except EvoQuantAPIError as e:
            raise HTTPException(status_code=502, detail=f"EvoQuantV3 不可用: {e}")

    result = build_contagion_map(correlation, rs, sector, portfolio)
    _cache_set(cache_key, result)
    return result


@app.get("/api/liquidation-shield")
async def liquidation_shield() -> dict[str, Any]:
    """清算级联保护：资金费率 + OI + VaR + 相关性 → 清算风险评估。"""
    cache_key = "liquidation_shield"
    if (cached := _cache_get(cache_key)) is not None:
        return cached

    from liquidation_shield import compute_liquidation_risk

    async with EvoQuantClient() as client:
        try:
            funding = await client.get_funding_all()
            portfolio = await client.get_portfolio_risk()
            correlation = await client.get_correlation_matrix()
        except EvoQuantAPIError as e:
            raise HTTPException(status_code=502, detail=f"EvoQuantV3 不可用: {e}")

        # OI 数据（已接入）
        oi_data: dict[str, Any] = {}
        for symbol in funding.get("funding_rates", {}).keys():
            try:
                oi = await client.get_open_interest(symbol.replace("/USDT", ""))
                oi_data[symbol] = oi
            except EvoQuantAPIError:
                pass

        # 清算激增（graceful fallback）
        liq_surges = None
        try:
            liq_surges = await client.get_liquidation_surges()
        except EvoQuantAPIError:
            pass

    result = compute_liquidation_risk(
        funding, portfolio, correlation, oi_data, liq_surges
    )
    _cache_set(cache_key, result)
    return result


@app.get("/api/whale-signals")
async def whale_signals() -> dict[str, Any]:
    """鲸鱼风险信号：真实鲸鱼活动数据 + 相对强弱 + 资金费率 → 大资金动向。"""
    cache_key = "whale_signals"
    if (cached := _cache_get(cache_key)) is not None:
        return cached

    from whale_signal import compute_whale_signals_async

    result = await compute_whale_signals_async()
    if "error" in result:
        raise HTTPException(status_code=502, detail=result["error"])

    _cache_set(cache_key, result)
    return result


@app.get("/api/stress-test")
async def stress_test(asset: str = "BTC", shock_pct: float = -20) -> dict[str, Any]:
    """压力测试模拟器：输入冲击资产+幅度，输出全组合预期损失。"""
    from stress_test import simulate_stress

    result = await simulate_stress(asset, shock_pct)
    if "error" in result:
        raise HTTPException(status_code=502, detail=result["error"])

    # 适配前端期望的结构
    summary = result.get("portfolio_summary", {})
    asset_losses = [
        {
            "symbol": a["symbol"],
            "expected_loss_pct": a["expected_loss_pct"],
            "current_exposure": a.get("correlation_to_shock", 0),
        }
        for a in result.get("asset_impacts", [])
    ]
    return {
        "shock_asset": result["shock_asset"],
        "shock_pct": result["shock_pct"],
        "total_portfolio_loss_pct": summary.get("total_portfolio_loss_pct", 0),
        "cascade_risk_level": summary.get("cascade_risk_level", "low"),
        "asset_losses": asset_losses,
    }


@app.get("/api/predictive-liquidation")
async def predictive_liquidation() -> dict[str, Any]:
    """预测性清算告警：未来 4h 各资产清算概率。"""
    from predictive_liq import predict_liquidations

    result = await predict_liquidations()
    if "error" in result:
        raise HTTPException(status_code=502, detail=result["error"])

    # 适配前端期望的结构
    cascade = result.get("global_cascade", {})
    assets = [
        {
            "symbol": a["symbol"],
            "liquidation_probability": a["liquidation_probability_4h"] / 100,
            "factors": {
                "oi_contribution": a["factors"]["oi_speed"] / 100,
                "funding_contribution": a["factors"]["funding_direction"] / 100,
                "correlation_contribution": a["factors"]["correlation_concentration"] / 100,
                "volatility_contribution": a["factors"]["volatility"] / 100,
            },
        }
        for a in result.get("asset_predictions", [])
    ]
    return {
        "cascade_probability": cascade.get("cascade_probability", 0) / 100,
        "cascade_risk_level": cascade.get("alert_level", "low"),
        "assets": assets,
    }


@app.get("/api/rebalancer-demo")
async def rebalancer_demo(scenario: str = "stress") -> dict[str, Any]:
    """实时调仓演示：模拟 Oracle 信号变化时 Vault 如何调仓。"""
    from rebalancer_demo import generate_rebalance_demo

    result = await generate_rebalance_demo(scenario)
    # 适配前端期望的结构
    sc_data = result.get("scenarios", {}).get(scenario, {})
    timeline = sc_data.get("timeline", [])
    stats = sc_data.get("stats", {})

    series = [
        {
            "timestamp": f"2024-01-01T{p['time_offset_min'] // 60:02d}:{p['time_offset_min'] % 60:02d}:00",
            "sui_position_pct": p["sui_pct"],
            "risk_score": p["risk_score"],
            "is_rebalance": p["action"] != "hold",
        }
        for p in timeline
    ]
    actions = [
        {
            "timestamp": f"2024-01-01T{p['time_offset_min'] // 60:02d}:{p['time_offset_min'] % 60:02d}:00",
            "action": p["action"],
            "reason": p["trigger"] or "",
            "from_pct": 0,
            "to_pct": p["sui_pct"],
        }
        for p in timeline if p["action"] != "hold"
    ]
    return {
        "scenario": scenario,
        "series": series,
        "actions": actions,
        "summary": {
            "total_rebalances": stats.get("rebalance_count", 0),
            "max_risk_reached": stats.get("max_risk_score", 0),
            "final_position_pct": timeline[-1]["sui_pct"] if timeline else 50,
        },
    }


@app.get("/api/protocol-aggregation")
async def protocol_aggregation(symbol: str = "SUI") -> dict[str, Any]:
    """多协议联动：一个 Oracle 信号同时保护 Lending/Perp/Vault。"""
    from protocol_aggregator import compute_protocol_params

    # 获取当前风险评分
    async with EvoQuantClient() as client:
        try:
            risk = await client.get_risk_score(symbol)
            risk_score = risk.get("risk_score", 50)
        except EvoQuantAPIError:
            risk_score = 50

    result = compute_protocol_params(risk_score, symbol)
    # 适配前端期望的结构
    categories = []
    for proto in result.get("protocols", []):
        wo = proto["without_oracle"]
        wi = proto["with_oracle"]
        effect = proto["protection_effect"]
        categories.append({
            "protocol_type": proto["protocol"].split("(")[0].strip().lower(),
            "protocol_name": proto["protocol"],
            "params": [{
                "parameter": proto["parameter"],
                "with_oracle": wi.get("description", ""),
                "without_oracle": wo.get("description", ""),
                "improvement": f"{effect['direction']} {effect['change_pct']}%",
            }],
        })
    return {
        "symbol": result["symbol"],
        "categories": categories,
        "protection_summary": {
            "total_improvement_score": risk_score,
            "description": result.get("summary", ""),
        },
    }


# ─── 新增功能端点 ───


@app.get("/api/history/{symbol}")
async def risk_history(symbol: str, hours: int = 24) -> dict[str, Any]:
    """历史风险趋势：返回指定时间段内的风险评分时间序列。"""
    from history_store import risk_store

    # 每次请求时尝试记录一条最新数据（补充 scheduler 间隔）
    async with EvoQuantClient() as client:
        try:
            risk = await client.get_risk_score(symbol)
            signal = await client.get_signal(symbol)
            macro = await client.get_macro_regime()
            risk_store.record(
                symbol=symbol.upper(),
                risk_score=risk.get("risk_score", 50),
                risk_level=risk.get("risk_level", "medium"),
                volatility=signal.get("volatility", 0),
                macro_stance=macro.get("overall_stance", "neutral"),
            )
        except (EvoQuantAPIError, Exception):
            pass

    history = risk_store.get_history(symbol.upper(), hours=hours)
    return {"symbol": symbol.upper(), "hours": hours, "data_points": len(history), "history": history}


@app.get("/api/cascade-simulator")
async def cascade_simulator(asset: str = "BTC", shock_pct: float = -30) -> dict[str, Any]:
    """清算瀑布模拟器：模拟连锁清算过程。"""
    from cascade_simulator import simulate_cascade

    async with EvoQuantClient() as client:
        try:
            correlation = await client.get_correlation_matrix()
            funding = await client.get_funding_all()
        except EvoQuantAPIError:
            correlation = {"symbols": ["BTC", "ETH", "SUI"], "correlation_matrix": {}}
            funding = {"funding_rates": {}}

    oi_data: dict[str, Any] = {}
    result = simulate_cascade(asset.upper(), shock_pct, correlation, funding, oi_data)
    return result


@app.get("/api/portfolio")
async def portfolio() -> dict[str, Any]:
    """Portfolio 追踪：用户持仓风险分析。"""
    from portfolio_tracker import compute_portfolio

    risk_scores: dict[str, Any] = {}
    async with EvoQuantClient() as client:
        for symbol in settings.tracked_symbols:
            try:
                risk_scores[symbol] = await client.get_risk_score(symbol)
            except EvoQuantAPIError:
                risk_scores[symbol] = {"risk_score": 50, "risk_level": "medium"}
        try:
            funding = await client.get_funding_all()
        except EvoQuantAPIError:
            funding = {"funding_rates": {}}

    return compute_portfolio(risk_scores, funding)


@app.get("/api/alert-rules")
async def list_alert_rules() -> dict[str, Any]:
    """列出所有自定义告警规则。"""
    from alert_rules import rule_store

    rules = rule_store.list_rules()
    return {"rules": rules, "count": len(rules)}


@app.get("/api/alert-rules/create")
async def create_alert_rule(
    name: str = "风险分告警",
    symbol: str = "SUI",
    metric: str = "risk_score",
    operator: str = ">",
    threshold: float = 70,
) -> dict[str, Any]:
    """创建自定义告警规则。"""
    from alert_rules import rule_store

    rule = rule_store.create_rule(name, symbol, metric, operator, threshold)
    return {"status": "created", "rule": rule}


@app.get("/api/alert-rules/delete/{rule_id}")
async def delete_alert_rule(rule_id: str) -> dict[str, Any]:
    """删除告警规则。"""
    from alert_rules import rule_store

    ok = rule_store.delete_rule(rule_id)
    return {"status": "deleted" if ok else "not_found"}


@app.get("/api/alert-rules/evaluate")
async def evaluate_alert_rules() -> dict[str, Any]:
    """评估所有规则，返回触发的告警。"""
    from alert_rules import rule_store

    current_data: dict[str, Any] = {}
    async with EvoQuantClient() as client:
        for symbol in settings.tracked_symbols:
            try:
                risk = await client.get_risk_score(symbol)
                signal = await client.get_signal(symbol)
                current_data[symbol] = {**risk, **signal}
            except EvoQuantAPIError:
                pass

    triggered = rule_store.evaluate_rules(current_data)
    return {"triggered_count": len(triggered), "triggered": triggered}


@app.get("/api/protocol-comparison")
async def protocol_comparison() -> dict[str, Any]:
    """协议安全排名对比。"""
    from protocol_comparison import compute_protocol_comparison

    risk_scores: dict[str, Any] = {}
    async with EvoQuantClient() as client:
        for symbol in settings.tracked_symbols:
            try:
                risk_scores[symbol] = await client.get_risk_score(symbol)
            except EvoQuantAPIError:
                risk_scores[symbol] = {"risk_score": 50, "risk_level": "medium"}
        try:
            funding = await client.get_funding_all()
        except EvoQuantAPIError:
            funding = {"funding_rates": {}}

    return compute_protocol_comparison(risk_scores, funding)


@app.get("/api/macro/detail")
async def macro_detail() -> dict[str, Any]:
    """宏观市场状态详情。"""
    from macro_detail import compute_macro_detail

    async with EvoQuantClient() as client:
        try:
            macro = await client.get_macro_regime()
            portfolio = await client.get_portfolio_risk()
        except EvoQuantAPIError:
            macro = {"overall_stance": "neutral", "indicators": {}}
            portfolio = {"var_95": 0.03}

    return compute_macro_detail(macro, portfolio)


@app.get("/api/liquidation-heatmap")
async def liquidation_heatmap() -> dict[str, Any]:
    """清算热力图：按交易所 × 杠杆倍数展示清算密度。"""
    cache_key = "liq_heatmap"
    if (cached := _cache_get(cache_key)) is not None:
        return cached

    from liquidation_heatmap import compute_liquidation_heatmap

    async with EvoQuantClient() as client:
        try:
            funding = await client.get_funding_all()
        except EvoQuantAPIError:
            funding = {"funding_rates": {}}

    oi_data: dict[str, Any] = {}
    result = compute_liquidation_heatmap(funding, oi_data)
    _cache_set(cache_key, result)
    return result


@app.get("/api/vault/attribution")
async def vault_attribution() -> dict[str, Any]:
    """Vault 收益归因。"""
    from vault_attribution import compute_vault_attribution

    async with EvoQuantClient() as client:
        try:
            risk = await client.get_risk_score(settings.tracked_symbols[0])
            risk_score = risk.get("risk_score", 50)
        except EvoQuantAPIError:
            risk_score = 50

    return compute_vault_attribution(risk_score)


def main() -> None:
    parser = argparse.ArgumentParser(description="EvoOracle 前端 API 服务")
    parser.add_argument("--host", default=settings.server_host)
    parser.add_argument("--port", type=int, default=settings.server_port)
    parser.add_argument("--reload", action="store_true")
    args = parser.parse_args()

    import uvicorn

    uvicorn.run("server.app:app", host=args.host, port=args.port, reload=args.reload)


if __name__ == "__main__":
    main()
