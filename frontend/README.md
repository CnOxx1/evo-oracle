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
| Oracle 面板 | [src/modules/oracle_dashboard/](src/modules/oracle_dashboard/README.md) | 链上信号实时监控 |
| Vault 界面 | [src/modules/vault_ui/](src/modules/vault_ui/README.md) | 存取款 + Protected vs Static 对比 |
| 历史回测 | [src/modules/backtest_view/](src/modules/backtest_view/README.md) | LUNA 崩盘策略复盘可视化 |

## 目录约定

```
frontend/
├── README.md
├── package.json
├── src/
│   ├── modules/
│   │   ├── oracle_dashboard/   （含 README.md + 组件）
│   │   ├── vault_ui/
│   │   └── backtest_view/
│   ├── api/                    （封装对 backend :8100 的调用）
│   └── lib/                    （Sui 客户端、通用工具）
```

## 启动

```bash
npm install
npm run dev          # 默认 http://localhost:5173
```

需要先启动 EvoOracle 后端 API（`:8100`）。

## 当前状态

> ⚠️ 脚手架阶段：定义了 `package.json`、模块文件夹与各模块 md。
> 具体 React 组件待初始化前端工程后逐模块开发。

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 初始化前端结构，定义三大模块文件夹与 md |
