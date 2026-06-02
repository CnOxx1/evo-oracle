# EvoOracle Backend

EvoOracle 的后端服务，承担两个角色：

1. **Bridge（桥接）** —— 定时从 EvoQuantV3 拉取市场信号，转换后发布到 Sui 链。
2. **前端 API** —— 给前端提供聚合后的只读 REST 接口（前后端分离）。

## 技术栈

- Python 3.10+
- FastAPI（前端 API 服务）
- httpx（异步 HTTP 客户端）
- APScheduler（定时调度）
- pysui / Sui SDK（链上交互）

## 模块结构

| 模块 | 目录 | 说明 |
| --- | --- | --- |
| `config` | [config/](config/README.md) | 集中配置：EvoQuantV3 地址、Sui 网络、对象 ID |
| `api_client` | [api_client/](api_client/README.md) | EvoQuantV3 API 客户端封装 |
| `risk_composer` | [risk_composer/](risk_composer/README.md) | 可解释风险评分（证据链加权拆解） |
| `alert_engine` | [alert_engine/](alert_engine/README.md) | 异常检测引擎（6 类告警 + 三级严重度） |
| `contagion_engine` | contagion_engine/ | 跨资产风险传导图（相关性矩阵 + 板块轮动 + 组合风险） |
| `liquidation_shield` | liquidation_shield/ | 清算级联保护（OI + 资金费率 + VaR + 相关性） |
| `whale_signal` | whale_signal/ | 鲸鱼风险信号（RS 突变 + 资金流向 + 资金费率） |
| `stress_test` | stress_test/ | 压力测试模拟器（冲击传导 + 级联清算估算） |
| `predictive_liq` | predictive_liq/ | 预测性清算告警（4因子加权 + sigmoid概率） |
| `protocol_aggregator` | protocol_aggregator/ | 多协议联动（一信号同时驱动 Lending/Perp/Vault） |
| `rebalancer_demo` | rebalancer_demo/ | 实时调仓演示（基于真实历史风险数据，三场景窗口选取） |
| `signal_processor` | [signal_processor/](signal_processor/README.md) | 信号 → 链上整数格式转换 |
| `sui_publisher` | [sui_publisher/](sui_publisher/README.md) | 提交 Move 合约调用 |
| `scheduler` | [scheduler/](scheduler/README.md) | Bridge 定时主循环 |
| `server` | [server/](server/README.md) | 给前端的聚合 REST API |

## 数据流

```
scheduler.runner（每 5 分钟）
   → api_client       拉取 EvoQuantV3 数据
   → signal_processor 转换成链上格式
   → sui_publisher    update_risk + rebalance

server.app（独立进程，常驻）
   → api_client       按前端请求实时拉取
   → 聚合 / 缓存 → 返回前端
```

## 启动

```bash
pip install -r requirements.txt

# Bridge 调度（拉取 + 上链）
python -m scheduler.runner

# 前端 API 服务（默认 :8100，避免与 EvoQuantV3 的 :8000 冲突）
python -m server.app --port 8100
```

## 配置

所有可变参数集中在 `config/settings.py`，关键项：

- `EVOQUANT_API_BASE = "http://127.0.0.1:8000"`
- `SUI_RPC_URL`、`SUI_NETWORK`
- `ORACLE_OBJECT_ID`、`VAULT_OBJECT_ID`、`ORACLE_ADMIN_CAP_ID`
- `POLL_INTERVAL_SECONDS = 300`

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 初始化后端结构与各模块脚手架 |
| 2026-05-30 | 新增 risk_composer（可解释评分）与 alert_engine（异常检测）两个模块，server 暴露对应接口 |
| 2026-05-31 | 实现 `/api/vault/state`（基于风险评分动态模拟仓位）和 `/api/backtest/luna`（硬编码 LUNA 崩盘时间序列）；sui_publisher 集成 pysui（保留 dry-run 兜底） |
| 2026-05-31 | 新增三大风险引擎：contagion_engine（跨资产传导图）、liquidation_shield（清算级联保护，已接入真实 OI 数据）、whale_signal（鲸鱼风险信号）；LUNA 回测升级为参数化交互式 demo |
| 2026-05-31 | 新增四大高级模块：stress_test（压力测试模拟器，基于相关性矩阵计算冲击传导+级联清算估算）、predictive_liq（预测性清算告警，OI增速/资金费率/相关性集中度/波动率四因子sigmoid概率）、protocol_aggregator（多协议联动，一信号同时驱动Lending LTV/Perp杠杆/Vault仓位）、rebalancer_demo（实时调仓演示，三场景24h时间序列动画） |
| 2026-05-31 | 移除所有模拟数据：liquidation_heatmap/cascade_simulator/rebalancer_demo 改为从 EvoQuantV3 获取真实 OI、清算 surges、历史风险时序数据驱动计算，不再使用 random 模块 |
