# config 模块

集中管理 EvoOracle 后端的所有可变配置，避免硬编码散落各处。

## 功能

- 定义 EvoQuantV3 数据基座的 API 地址（默认 `http://127.0.0.1:8000`）
- 定义 Sui 网络与 RPC 地址
- 定义已部署合约的对象 ID（Oracle、Vault、AdminCap）
- 定义 Bridge 轮询间隔、重点资产列表
- 支持通过环境变量 / `.env` 覆盖默认值

## 文件

| 文件 | 说明 |
| --- | --- |
| `settings.py` | 基于 pydantic-settings 的配置类，单例 `settings` |

## 关键配置项

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| `evoquant_api_base` | `http://127.0.0.1:8000` | EvoQuantV3 接口地址 |
| `sui_rpc_url` | testnet fullnode | Sui RPC |
| `sui_network` | `testnet` | 网络环境 |
| `oracle_object_id` | `""` | 部署后填入 |
| `vault_object_id` | `""` | 部署后填入 |
| `oracle_admin_cap_id` | `""` | 部署后填入 |
| `poll_interval_seconds` | `300` | Bridge 轮询间隔 |
| `tracked_symbols` | `["SUI","BTC","ETH"]` | 上链的重点资产 |

## 用法

```python
from config.settings import settings

print(settings.evoquant_api_base)   # http://127.0.0.1:8000
```

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 初始化配置模块，固定 EvoQuantV3 地址为 127.0.0.1:8000 |
