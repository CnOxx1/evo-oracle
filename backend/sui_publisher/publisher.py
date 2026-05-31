"""Sui 链上发布器。

把转换后的 payload 写入 Oracle 对象，并触发 RiskVault 再平衡。

未配置合约对象 ID 时运行在 dry-run 模式：只打印 payload，不实际上链，
方便在合约部署前先把数据流跑通。

配置齐全时使用 pysui 构造并执行 Move Call 交易。
"""

from __future__ import annotations

import logging
from typing import Any

from config.settings import settings

logger = logging.getLogger(__name__)

# Sui 系统时钟对象 ID（所有网络通用）
SUI_CLOCK_OBJECT_ID = "0x0000000000000000000000000000000000000000000000000000000000000006"


class SuiPublisher:
    """Sui 链上交易提交器。"""

    def __init__(self) -> None:
        self.package_id = settings.package_id
        self.oracle_object_id = settings.oracle_object_id
        self.vault_object_id = settings.vault_object_id
        self.admin_cap_id = settings.oracle_admin_cap_id
        self.rpc_url = settings.sui_rpc_url
        self._client = None

    @property
    def is_configured(self) -> bool:
        """合约对象 ID 是否齐全。未齐全则走 dry-run。"""
        return bool(self.package_id and self.oracle_object_id and self.admin_cap_id)

    def _get_client(self):
        """延迟初始化 pysui 客户端。配置不全或 pysui 未安装时返回 None。"""
        if self._client is not None:
            return self._client
        try:
            from pysui.sui.sui_config import SuiConfig
            from pysui.sui.sui_clients.sync_client import SuiClient

            cfg = SuiConfig.user_config(rpc_url=self.rpc_url)
            self._client = SuiClient(cfg)
            logger.info("pysui 客户端初始化成功 rpc=%s", self.rpc_url)
            return self._client
        except ImportError:
            logger.warning("pysui 未安装，回退到 dry-run 模式")
            return None
        except Exception as e:
            logger.warning("pysui 初始化失败: %s，回退到 dry-run", e)
            return None

    async def update_oracle(self, payload: dict[str, Any]) -> str | None:
        """提交 oracle::update_risk 交易。返回交易 digest（dry-run 返回 None）。"""
        if not self.is_configured:
            logger.info("[dry-run] update_risk payload=%s", payload)
            return None

        client = self._get_client()
        if client is None:
            logger.info("[dry-run/no-pysui] update_risk payload=%s", payload)
            return None

        try:
            from pysui.sui.sui_txn import SyncTransaction

            txn = SyncTransaction(client=client)
            txn.move_call(
                target=f"{self.package_id}::oracle::update_risk",
                arguments=[
                    txn.make_move_vec([self.admin_cap_id]),
                    txn.make_move_vec([self.oracle_object_id]),
                    payload["risk_score"],
                    payload["risk_level"],
                    payload["trend"],
                    payload["funding_anomaly"],
                    payload["macro_stance"],
                    payload["annualized_vol"],
                    SUI_CLOCK_OBJECT_ID,
                ],
            )
            result = txn.execute(gas_budget=10_000_000)
            digest = result.digest if hasattr(result, "digest") else str(result)
            logger.info("oracle::update_risk tx=%s", digest)
            return digest
        except Exception as e:
            logger.error("update_oracle 交易失败: %s", e)
            # 失败时回退到 dry-run 记录
            logger.info("[fallback-dry-run] payload=%s", payload)
            return None

    async def rebalance_vault(self) -> str | None:
        """提交 risk_vault::rebalance 交易。"""
        if not self.is_configured or not self.vault_object_id:
            logger.info("[dry-run] rebalance vault=%s", self.vault_object_id or "<unset>")
            return None

        client = self._get_client()
        if client is None:
            logger.info("[dry-run/no-pysui] rebalance vault=%s", self.vault_object_id)
            return None

        try:
            from pysui.sui.sui_txn import SyncTransaction

            txn = SyncTransaction(client=client)
            txn.move_call(
                target=f"{self.package_id}::risk_vault::rebalance",
                arguments=[
                    txn.make_move_vec([self.vault_object_id]),
                    txn.make_move_vec([self.oracle_object_id]),
                    SUI_CLOCK_OBJECT_ID,
                ],
            )
            result = txn.execute(gas_budget=10_000_000)
            digest = result.digest if hasattr(result, "digest") else str(result)
            logger.info("risk_vault::rebalance tx=%s", digest)
            return digest
        except Exception as e:
            logger.error("rebalance_vault 交易失败: %s", e)
            return None

    async def publish(self, payload: dict[str, Any]) -> dict[str, str | None]:
        """组合发布：先更新 Oracle，再触发 Vault 再平衡。"""
        oracle_digest = await self.update_oracle(payload)
        vault_digest = await self.rebalance_vault()
        return {"oracle_tx": oracle_digest, "vault_tx": vault_digest}
