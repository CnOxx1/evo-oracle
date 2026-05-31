# EvoOracle Frontend

EvoOracle 的前端 Dashboard。展示链上信号、Vault 对比与历史回测，是黑客松 Demo 的门面。

## 技术栈

- React 18 + TypeScript
- Vite（构建/开发服务器）
- @mysten/dapp-kit（Sui 钱包连接、链上读取）
- @mysten/sui（Sui SDK）
- Recharts（收益对比 / 回测曲线）

## 前后端分离

前端只通过两条途径取数：

1. **EvoOracle 后端 API**（`http://127.0.0.1:8100/api/*`）—— 聚合后的展示数据
2. **Sui 链**（通过 dapp-kit）—— 钱包交互、读取链上 Oracle/Vault 对象

前端**不直接**访问 EvoQuantV3（127.0.0.1:8000）。

## 模块结构

每个模块一个文件夹，独立 md：

| 模块 | 目录 | 功能 |
| --- | --- | --- |
| 登录 (zkLogin) | [src/modules/auth/](src/modules/auth/README.md) | Google 一键登录，无需钱包 |
| Oracle 面板 | [src/modules/oracle_dashboard/](src/modules/oracle_dashboard/README.md) | 链上信号实时监控 |
| 风险拆解 | [src/modules/risk_breakdown/](src/modules/risk_breakdown/README.md) | 可解释风险评分可视化 |
| 告警流 | [src/modules/alert_feed/](src/modules/alert_feed/README.md) | 实时异常告警流 |
| Vault 界面 | [src/modules/vault_ui/](src/modules/vault_ui/README.md) | 存取款 + Protected vs Static 对比 |
| 历史回测 | [src/modules/backtest_view/](src/modules/backtest_view/README.md) | LUNA 崩盘策略复盘可视化 |
| 压力测试 | src/modules/stress_test/ | 冲击传导模拟器（选资产+幅度，实时计算全组合损失） |
| 清算预测 | src/modules/predictive_liq/ | 4因子加权预测未来4h清算概率 |
| 多协议联动 | src/modules/protocol_agg/ | 一信号同时驱动 Lending/Perp/Vault 参数对比 |
| 调仓演示 | src/modules/rebalancer_demo/ | 三场景24h时间序列调仓动画 |

## 目录约定

```
frontend/
├── README.md
├── package.json
├── src/
│   ├── modules/
│   │   ├── auth/               （zkLogin 登录）
│   │   ├── oracle_dashboard/   （含 README.md + 组件）
│   │   ├── risk_breakdown/
│   │   ├── alert_feed/
│   │   ├── vault_ui/
│   │   ├── backtest_view/
│   │   ├── contagion_map/      （跨资产传导图）
│   │   ├── liquidation_shield/ （清算级联保护）
│   │   ├── whale_signal/       （鲸鱼信号）
│   │   ├── stress_test/        （压力测试模拟器）
│   │   ├── predictive_liq/     （清算概率预测）
│   │   ├── protocol_agg/       （多协议联动）
│   │   └── rebalancer_demo/    （调仓演示动画）
│   ├── api/                    （封装对 backend :8100 的调用）
│   └── lib/                    （Sui 客户端、zkLogin.ts、通用工具）
```

## 启动

```bash
npm install
npm run dev          # 默认 http://localhost:5173
```

需要先启动 EvoOracle 后端 API（`:8100`）。

## 当前状态

> ✅ Demo-ready：所有模块组件已实现，前端可正常构建和运行。

## 启动

```bash
npm install
npm run dev          # 默认 http://localhost:5173
```

需要先启动 EvoOracle 后端 API（`:8100`）。Vite dev server 已配置 `/api` 代理到后端。

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 初始化前端结构，定义三大模块文件夹与 md |
| 2026-05-30 | 新增 risk_breakdown（风险拆解）与 alert_feed（告警流）模块 |
| 2026-05-30 | 新增 auth（zkLogin）模块与 lib/zkLogin.ts 登录流程工具 |
| 2026-05-31 | 完成全部前端组件实现：OracleDashboard、RiskBreakdown、AlertFeed、VaultUI、BacktestView、Auth；新增 API client、suiClient、format 工具；Vite 构建基础设施（vite.config.ts、tsconfig.json、index.html、main.tsx、index.css 暗色主题）；App Shell Tab 导航 |
| 2026-05-31 | 新增四大高级模块：StressTest（压力测试模拟器）、PredictiveLiq（清算概率预测）、ProtocolAgg（多协议联动对比）、RebalancerDemo（三场景调仓动画）；Tab 导航扩展至 12 页 |
