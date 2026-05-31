"""Bridge 定时主循环。

编排 api_client → signal_processor → sui_publisher，
每 poll_interval_seconds 把 EvoQuantV3 信号发布到 Sui 链。
同时记录历史风险数据到 SQLite。
"""

from __future__ import annotations

import asyncio
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from api_client.client import EvoQuantAPIError, EvoQuantClient
from config.settings import settings
from history_store import risk_store
from signal_processor.processor import build_oracle_payload
from sui_publisher.publisher import SuiPublisher

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("evo-oracle.scheduler")


async def run_once() -> None:
    """执行一轮：拉取 → 转换 → 上链 → 记录历史。"""
    publisher = SuiPublisher()

    async with EvoQuantClient() as client:
        if not await client.is_healthy():
            logger.warning("EvoQuantV3 数据管道不健康，跳过本轮")
            return

        try:
            macro = await client.get_macro_regime()
        except EvoQuantAPIError as e:
            logger.warning("获取宏观情绪失败，使用空值: %s", e)
            macro = {}

        for symbol in settings.tracked_symbols:
            try:
                signal = await client.get_signal(symbol)
                risk = await client.get_risk_score(symbol)
            except EvoQuantAPIError as e:
                logger.error("拉取 %s 数据失败，跳过: %s", symbol, e)
                continue

            # 记录历史风险数据
            try:
                risk_store.record(
                    symbol=symbol,
                    risk_score=risk.get("risk_score", 50),
                    risk_level=risk.get("risk_level", "medium"),
                    volatility=signal.get("volatility", 0),
                    macro_stance=macro.get("overall_stance", "neutral"),
                )
                logger.info("已记录 %s 历史风险数据: score=%s", symbol, risk.get("risk_score"))
            except Exception as e:
                logger.error("记录 %s 历史数据失败: %s", symbol, e)

            payload = build_oracle_payload(signal, risk, macro)
            logger.info("payload[%s]=%s", symbol, payload)

            try:
                result = await publisher.publish(payload)
                logger.info("已发布 %s: %s", symbol, result)
            except NotImplementedError:
                logger.info("dry-run: %s 未实际上链（合约未部署）", symbol)
            except Exception as e:  # noqa: BLE001
                logger.error("发布 %s 失败: %s", symbol, e)


def main() -> None:
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        run_once,
        "interval",
        seconds=settings.poll_interval_seconds,
        next_run_time=None,
    )
    scheduler.start()
    logger.info(
        "Bridge 调度启动，间隔 %ss，资产 %s",
        settings.poll_interval_seconds,
        settings.tracked_symbols,
    )

    loop = asyncio.get_event_loop()
    loop.run_until_complete(run_once())  # 启动即跑一轮
    try:
        loop.run_forever()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Bridge 调度停止")


if __name__ == "__main__":
    main()
