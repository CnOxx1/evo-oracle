# server 模块

给前端提供聚合后的只读 REST API。前后端分离的后端出口——前端只与本服务（和 Sui 链）交互，不直接访问 EvoQuantV3。

## 功能

- 聚合 EvoQuantV3 的多个接口，输出前端友好的数据结构
- 轻量内存缓存（默认 30s TTL），降低对数据基座的压力
- CORS 放开，方便前端本地开发

## 接口

| 接口 | 说明 | 对应前端模块 |
| --- | --- | --- |
| `GET /api/health` | EvoOracle 后端 + 数据基座健康 | 全局 |
| `GET /api/overview` | 全局风险概览 | overview |
| `GET /api/oracle/{symbol}` | 单资产链上信号视图 | oracle_dashboard |
| `GET /api/oracle` | 全部 tracked 资产信号摘要 | oracle_dashboard |
| `GET /api/risk-breakdown/{symbol}` | 可解释风险评分 | risk_breakdown |
| `GET /api/alerts/{symbol}` | 单资产异常告警列表 | alert_feed |
| `GET /api/alerts` | 全资产告警流 | alert_feed |
| `GET /api/vault/state` | Vault 当前仓位 + 对比 | vault_ui |
| `GET /api/vault/attribution` | Vault 收益归因分析 | vault_attribution |
| `GET /api/backtest/luna` | LUNA 崩盘历史回测 | backtest_view |
| `GET /api/contagion-map` | 跨资产风险传导图 | contagion_map |
| `GET /api/liquidation-shield` | 清算级联保护 | liquidation_shield |
| `GET /api/liquidation-heatmap` | 清算热力图 | liq_heatmap |
| `GET /api/whale-signals` | 鲸鱼风险信号 | whale_signal |
| `GET /api/stress-test` | 压力测试模拟器 | stress_test |
| `GET /api/predictive-liquidation` | 预测性清算告警 | predictive_liq |
| `GET /api/rebalancer-demo` | 实时调仓演示 | rebalancer_demo |
| `GET /api/protocol-aggregation` | 多协议联动参数 | protocol_agg |
| `GET /api/history/{symbol}` | 历史风险趋势（真实数据） | history |
| `GET /api/cascade-simulator` | 清算瀑布模拟器 | cascade |
| `GET /api/portfolio` | Portfolio 持仓风险分析 | portfolio |
| `GET /api/alert-rules` | 自定义告警规则列表 | alert_rules |
| `GET /api/alert-rules/create` | 创建告警规则 | alert_rules |
| `GET /api/alert-rules/delete/{id}` | 删除告警规则 | alert_rules |
| `GET /api/alert-rules/evaluate` | 评估规则触发状态 | alert_rules |
| `GET /api/protocol-comparison` | 协议安全排名对比 | protocol_compare |
| `GET /api/macro/detail` | 宏观市场状态详情 | macro_regime |

## 运行

```bash
python -m server.app --port 8100
```

启动后：

- Swagger UI: `http://localhost:8100/docs`

## 端口约定

默认 `:8100`，与 EvoQuantV3 的 `:8000` 区分，避免冲突。

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 初始化前端 API 服务，定义 5 个聚合接口（部分占位） |
| 2026-05-31 | 新增 8 个功能端点：history / cascade / portfolio / alert-rules / protocol-comparison / macro / liquidation-heatmap / vault-attribution |
