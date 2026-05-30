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
            raise HTTPException(status_code=502, detail=f"数据基座不可用: {e}")

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
            raise HTTPException(status_code=502, detail=f"数据基座不可用: {e}")

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
            raise HTTPException(status_code=502, detail=f"数据基座不可用: {e}")

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

    脚手架阶段：返回结构占位，待 RiskVault 合约接入后替换为链上真实数据。
    """
    return {
        "status": "scaffold",
        "note": "待 RiskVault 合约部署后接入链上真实数据",
        "protected": {"sui_pct": None, "usdc_pct": None, "pnl_7d": None},
        "static": {"sui_pct": 50, "usdc_pct": 50, "pnl_7d": None},
    }


@app.get("/api/backtest/luna")
async def backtest_luna() -> dict[str, Any]:
    """LUNA 崩盘期间历史回测序列。

    脚手架阶段：返回结构占位，待回测计算接入 /time-slice/range 后替换。
    """
    return {
        "status": "scaffold",
        "note": "待接入 EvoQuantV3 /time-slice/range 历史数据后替换",
        "window": {"start": "2022-05-07", "end": "2022-05-13"},
        "series": [],
    }


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
