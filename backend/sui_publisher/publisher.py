"""Sui 链上发布器。

把转换后的 payload 写入 Oracle 对象，并触发 RiskVault 再平衡。

未配置合约对象 ID 时运行在 dry-run 模式：只打印 payload，不实际上链，
方便在合约部署前先把数据流跑通。
"""

from __future__ import annotations

import logging
from typing import Any

from config.settings import settings

logger = logging.getLogger(__name__)


class SuiPublisher:
    """Sui 链上交易提交器。"""

    def __init__(self) -> None:
        self.package_id = settings.package_id
        self.oracle_object_id = settings.oracle_object_id
        self.vault_object_id = settings.vault_object_id
        self.admin_cap_id = settings.oracle_admin_cap_id
        self.rpc_url = settings.sui_rpc_url

    @property
    def is_configured(self) -> bool:
        """合约对象 ID 是否齐全。未齐全则走 dry-run。"""
        return bool(self.package_id and self.oracle_object_id and self.admin_cap_id)

    async def update_oracle(self, payload: dict[str, Any]) -> str | None:
        """提交 oracle::update_risk 交易。返回交易 digest（dry-run 返回 None）。"""
        if not self.is_configured:
            logger.info("[dry-run] update_risk payload=%s", payload)
            return None

        # TODO: 合约部署后用 pysui 构造并执行交易
        # tx = SuiTransaction(client=...)
        # tx.move_call(
        #     target=f"{self.package_id}::oracle::update_risk",
        #     arguments=[self.admin_cap_id, self.oracle_object_id,
        #                payload["risk_score"], payload["risk_level"],
        #                payload["trend"], payload["funding_anomaly"],
        #                payload["macro_stance"], payload["annualized_vol"],
        #                SUI_CLOCK_OBJECT_ID],
        # )
        # result = await tx.execute()
        # return result.digest
        raise NotImplementedError("链上提交待合约部署后接入 pysui")

    async def rebalance_vault(self) -> str | None:
        """提交 risk_vault::rebalance 交易。"""
        if not self.is_configured or not self.vault_object_id:
            logger.info("[dry-run] rebalance vault=%s", self.vault_object_id or "<unset>")
            return None

        # TODO: 合约部署后接入
        raise NotImplementedError("链上提交待合约部署后接入 pysui")

    async def publish(self, payload: dict[str, Any]) -> dict[str, str | None]:
        """组合发布：先更新 Oracle，再触发 Vault 再平衡。"""
        oracle_digest = await self.update_oracle(payload)
        vault_digest = await self.rebalance_vault()
        return {"oracle_tx": oracle_digest, "vault_tx": vault_digest}
