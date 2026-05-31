# scheduler 模块

Bridge 的定时主循环：编排 `api_client → signal_processor → sui_publisher`，每 5 分钟把 EvoQuantV3 的最新信号发布到 Sui 链，同时记录历史风险数据到 SQLite。

## 功能

- 周期性（默认 300s）执行一轮「拉取 → 转换 → 上链 → 记录历史」
- 先检查数据基座健康（`is_healthy`），不健康则跳过本轮
- 对 `tracked_symbols`（默认 SUI/BTC/ETH）逐个处理
- 每轮将各资产的 risk_score / volatility / macro_stance 写入 SQLite 历史存储
- 单个资产失败不影响其他资产，单轮失败不影响整体循环

## 一轮流程

```
1. EvoQuantClient.is_healthy()        ← 数据管道是否健康
2. EvoQuantClient.get_macro_regime()  ← 全局宏观情绪（共用）
3. for symbol in tracked_symbols:
     get_signal(symbol) + get_risk_score(symbol)
     → risk_store.record(...)           ← 写入历史 SQLite
     → build_oracle_payload(...)
     → SuiPublisher.publish(payload)
```

## 运行

```bash
python -m scheduler.runner
```

## 文件

| 文件 | 说明 |
| --- | --- |
| `runner.py` | APScheduler 主循环入口，含单轮 `run_once()` 协程 |

## 设计要点

- `run_once()` 可独立调用，便于手动触发与测试
- 全程结构化日志，记录每个资产的 payload 与交易 digest
- dry-run 模式下也能完整跑通，验证数据流
- 历史数据自动积累，供 `/api/history/{symbol}` 端点查询

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 初始化调度主循环，支持 run_once 与周期调度 |
| 2026-05-31 | 接入 history_store，每轮记录真实风险数据到 SQLite |
