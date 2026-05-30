# EvoOracle Contracts

EvoOracle 的 Sui Move 合约层，包含两个模块：链上风险预言机（Oracle）与自动调仓金库（RiskVault）。

## 技术栈

- Sui Move
- Sui CLI（编译 / 部署 / 调用）

## 模块结构

| 模块 | 目录 | 功能 |
| --- | --- | --- |
| Oracle | [oracle/](oracle/README.md) | 存储各资产风险评分 + AI 信号，授权更新、公开读取 |
| RiskVault | [risk_vault/](risk_vault/README.md) | 读取 Oracle，按风险评分自动调整 SUI/USDC 仓位 |
| Alert | [alert/](alert/README.md) | 把异常作为链上 event 发出，协议可订阅 |
| LendingAdapter | [adapters/lending_adapter/](adapters/lending_adapter/README.md) | 借贷协议接入示例：动态 LTV |
| PerpAdapter | [adapters/perp_adapter/](adapters/perp_adapter/README.md) | 永续协议接入示例：动态最大杠杆 |

## 包结构

本目录是一个 Sui Move package，`Move.toml` 统一管理；
两个模块的源码分别放在 `oracle/sources/` 与 `risk_vault/sources/`，逻辑上独立、文档独立。

```
contracts/
├── Move.toml
├── oracle/
│   ├── README.md
│   └── sources/oracle.move
├── risk_vault/
│   ├── README.md
│   └── sources/risk_vault.move
├── alert/
│   ├── README.md
│   └── sources/alert.move
└── adapters/
    ├── lending_adapter/
    │   ├── README.md
    │   └── sources/lending_adapter.move
    └── perp_adapter/
        ├── README.md
        └── sources/perp_adapter.move
```

## 编译与部署

> 📌 构建约定：Sui 的 `sui move build` 默认只扫描 package 根目录下的 `sources/`。
> 本项目为满足「每模块一个文件夹」的文档化要求，把源码放在 `oracle/sources/` 与
> `risk_vault/sources/`。构建前需把两个模块的 `.move` 软链接/复制到根 `sources/`，
> 或在 `Move.toml` 中后续配置。脚手架阶段以模块文件夹为准（文档 + 源码同址）。

```bash
cd contracts
# 构建前：收集各模块源码到 sources/
mkdir -p sources
cp oracle/sources/*.move risk_vault/sources/*.move \
   alert/sources/*.move \
   adapters/lending_adapter/sources/*.move \
   adapters/perp_adapter/sources/*.move sources/

sui move build
sui client publish --gas-budget 100000000
```

部署后把输出的 `packageId` 与各对象 ID 填入 `backend/config/settings.py`。

## 与后端的关系

```
backend/sui_publisher
   → oracle::update_risk      （AdminCap 授权，每 5 分钟）
   → risk_vault::rebalance    （读取 Oracle 后调仓）
```

## 当前状态

> ⚠️ 脚手架阶段：合约定义了完整的数据结构与函数签名骨架，
> 核心调仓逻辑已给出，实际 DEX swap / Coin 处理为 TODO，待联调时补全。

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 初始化 Move package，定义 Oracle 与 RiskVault 骨架 |
| 2026-05-30 | 新增 alert（链上 event 告警）与 lending_adapter（动态 LTV）模块 |
| 2026-05-30 | 新增 perp_adapter（动态最大杠杆），适配器升级为多协议（借贷 + 永续） |
