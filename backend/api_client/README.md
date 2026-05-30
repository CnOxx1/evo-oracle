# api_client 模块

封装对 EvoQuantV3 数据基座（`http://127.0.0.1:8000`）的所有 HTTP 调用，是后端唯一与数据基座直接交互的模块。

## 功能

- 提供异步客户端 `EvoQuantClient`，统一超时、错误处理、重试
- 封装 EvoOracle 真正用到的接口子集
- 屏蔽 EvoQuantV3 的 API 细节，对上层只暴露语义化方法

## 封装的接口

| 方法 | 对应 EvoQuantV3 接口 | 说明 |
| --- | --- | --- |
| `get_signal(symbol)` | `GET /signals/{symbol}` | 单资产综合信号 bundle |
| `get_all_signals()` | `GET /signals/` | 全资产信号摘要 |
| `get_risk_score(symbol)` | `GET /risk/score/{symbol}` | 单资产风险评分 |
| `get_volatility()` | `GET /risk/volatility` | 全资产波动率 |
| `get_macro_regime()` | `GET /macro/regime` | 宏观情绪 |
| `get_sentiment_summary()` | `GET /sentiment/summary` | 新闻情感摘要 |
| `get_cross_asset_summary()` | `GET /cross-asset/summary` | 跨资产摘要 |
| `get_health()` | `GET /health/` | 数据管道健康状态 |
| `get_time_slice_range(...)` | `GET /time-slice/range` | 历史回测数据 |

## 用法

```python
from api_client.client import EvoQuantClient

async with EvoQuantClient() as client:
    if await client.is_healthy():
        signal = await client.get_signal("SUI")
        risk = await client.get_risk_score("SUI")
```

## 设计要点

- 所有方法返回原始 dict，不做业务转换（转换交给 `signal_processor`）
- 网络异常抛出 `EvoQuantAPIError`，由调用方决定是否跳过本轮
- 基地址来自 `config.settings.evoquant_api_base`，不硬编码

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 初始化客户端，封装 9 个核心接口 |
