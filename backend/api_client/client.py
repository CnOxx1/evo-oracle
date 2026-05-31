"""EvoQuantV3 API 客户端。

封装对数据基座 (http://127.0.0.1:8000) 的所有调用。
上层模块只通过本客户端访问数据基座，不直接发 HTTP。
"""

from __future__ import annotations

from typing import Any

import httpx

from config.settings import settings


class EvoQuantAPIError(Exception):
    """EvoQuantV3 API 调用失败。"""


class EvoQuantClient:
    """EvoQuantV3 数据基座异步客户端。"""

    def __init__(self, base_url: str | None = None, timeout: float | None = None):
        self.base_url = (base_url or settings.evoquant_api_base).rstrip("/")
        self.timeout = timeout or settings.api_timeout_seconds
        self._client: httpx.AsyncClient | None = None

    async def __aenter__(self) -> "EvoQuantClient":
        self._client = httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout)
        return self

    async def __aexit__(self, *exc) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    async def _get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        if self._client is None:
            raise RuntimeError("EvoQuantClient 必须在 async with 上下文中使用")
        try:
            resp = await self._client.get(path, params=params)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            raise EvoQuantAPIError(f"GET {path} -> {e.response.status_code}") from e
        except httpx.HTTPError as e:
            raise EvoQuantAPIError(f"GET {path} 网络错误: {e}") from e

    # ---- 健康检查 ----
    async def get_health(self) -> dict[str, Any]:
        return await self._get("/health/")

    async def is_healthy(self) -> bool:
        try:
            health = await self.get_health()
            return health.get("status") == "healthy"
        except EvoQuantAPIError:
            return False

    # ---- 信号 ----
    async def get_signal(self, symbol: str) -> dict[str, Any]:
        return await self._get(f"/signals/{symbol}")

    async def get_all_signals(self, risk_level: str | None = None) -> dict[str, Any]:
        params = {"risk_level": risk_level} if risk_level else None
        return await self._get("/signals/", params=params)

    # ---- 风险 ----
    async def get_risk_score(self, symbol: str) -> dict[str, Any]:
        return await self._get(f"/risk/score/{symbol}")

    async def get_volatility(self) -> dict[str, Any]:
        return await self._get("/risk/volatility")

    # ---- 宏观 / 情感 / 跨资产 ----
    async def get_macro_regime(self) -> dict[str, Any]:
        return await self._get("/macro/regime")

    async def get_sentiment_summary(self) -> dict[str, Any]:
        return await self._get("/sentiment/summary")

    async def get_cross_asset_summary(self) -> dict[str, Any]:
        return await self._get("/cross-asset/summary")

    async def get_correlation_matrix(self) -> dict[str, Any]:
        return await self._get("/cross-asset/correlation")

    async def get_relative_strength(self) -> dict[str, Any]:
        return await self._get("/cross-asset/relative-strength")

    async def get_sector_rotation(self) -> dict[str, Any]:
        return await self._get("/cross-asset/sector-rotation")

    async def get_fund_flow(self) -> dict[str, Any]:
        return await self._get("/cross-asset/fund-flow")

    async def get_portfolio_risk(self) -> dict[str, Any]:
        return await self._get("/risk/portfolio/latest")

    async def get_funding_all(self) -> dict[str, Any]:
        return await self._get("/exchange/funding")

    async def get_funding(self, symbol: str) -> dict[str, Any]:
        return await self._get(f"/exchange/funding/{symbol}")

    # ---- 清算 / OI（待 EvoQuantV3 数据就绪） ----
    async def get_liquidations(self, symbol: str) -> dict[str, Any]:
        return await self._get(f"/exchange/liquidations/{symbol}")

    async def get_liquidation_surges(self) -> dict[str, Any]:
        return await self._get("/monitor/liquidation-surges")

    async def get_open_interest(self, symbol: str) -> dict[str, Any]:
        return await self._get(f"/exchange/open-interest/{symbol}")

    # ---- 链上鲸鱼（待 EvoQuantV3 数据就绪） ----
    async def get_whale_activity(self, symbol: str) -> dict[str, Any]:
        return await self._get(f"/onchain/whale-activity/{symbol}")

    async def get_exchange_flow(self, symbol: str) -> dict[str, Any]:
        return await self._get(f"/onchain/exchange-flow/{symbol}")

    # ---- 历史回测 ----
    async def get_time_slice_range(
        self,
        start: str,
        end: str,
        interval: int = 3600,
        symbols: str | None = None,
        domains: str | None = None,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {"start": start, "end": end, "interval": interval}
        if symbols:
            params["symbols"] = symbols
        if domains:
            params["domains"] = domains
        return await self._get("/time-slice/range", params=params)
