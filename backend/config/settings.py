"""EvoOracle 后端集中配置。

所有可变参数集中在此，支持环境变量 / .env 覆盖。
"""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="EVO_", env_file=".env", extra="ignore")

    # ---- EvoQuantV3 数据基座 ----
    evoquant_api_base: str = "http://127.0.0.1:8000"
    api_timeout_seconds: float = 10.0

    # ---- Sui 网络 ----
    sui_network: str = "testnet"
    sui_rpc_url: str = "https://fullnode.testnet.sui.io:443"

    # ---- 已部署合约对象 ID（部署后填入）----
    package_id: str = ""
    oracle_object_id: str = ""
    vault_object_id: str = ""
    oracle_admin_cap_id: str = ""

    # ---- Bridge 调度 ----
    poll_interval_seconds: int = 300
    tracked_symbols: list[str] = ["SUI", "BTC", "ETH"]

    # ---- 前端 API 服务 ----
    server_host: str = "0.0.0.0"
    server_port: int = 8100
    cache_ttl_seconds: int = 30


settings = Settings()
