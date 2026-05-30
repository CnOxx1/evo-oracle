# EvoOracle

> 基于机构级数据的 Sui DeFi 风险引擎 —— 让 DeFi 协议的风险参数从「静态」变成「动态」。

## 一句话定位

把传统金融的波动率曲面、宏观因子、期权定价、链上行为，通过 AI 聚合后实时写入 Sui 链。任何 DeFi 协议接入后，可以把固定抵押率/固定仓位变成随市场风险自动调整的动态参数，避免 2022 年 LUNA 式的级联清算。

## 项目背景

本项目是 [`EvoQuantV3`](../EvoQuantV3-main) 数据基座的链上分发层。

```
EvoQuantV3（AI 原生加密市场数据基座，已有）
    ↓  REST API @ http://127.0.0.1:8000
EvoOracle Bridge（本项目后端）
    ↓  Sui SDK 提交交易
Sui Move 合约（Oracle + RiskVault）
    ↓
前端 Dashboard（信号面板 + Vault 对比 + 历史回测）
```

EvoQuantV3 负责「理解市场」，EvoOracle 负责「把市场判断送上链并产生价值」。

## 顶层架构（前后端分离）

| 层 | 目录 | 技术栈 | 职责 |
| --- | --- | --- | --- |
| 后端 | [`backend/`](backend/README.md) | Python + FastAPI | 拉取 EvoQuantV3 数据 → 转换 → 发布到 Sui → 给前端提供聚合 API |
| 合约 | [`contracts/`](contracts/README.md) | Sui Move | 链上存储风险评分/AI 信号，RiskVault 自动调仓 |
| 前端 | [`frontend/`](frontend/README.md) | React + Vite + TS | Oracle 监控面板、Vault 存取与对比、LUNA 历史回测 |

前后端完全分离：前端只与 `backend/server` 暴露的 REST API 和 Sui 链交互，不直接访问 EvoQuantV3。

## 模块总览

### backend（后端）

| 模块 | 目录 | 功能 |
| --- | --- | --- |
| API 客户端 | `backend/api_client` | 封装对 EvoQuantV3 (127.0.0.1:8000) 的所有调用 |
| 信号处理 | `backend/signal_processor` | 把 API 返回数据转换成链上整数格式 |
| Sui 发布 | `backend/sui_publisher` | 调用 Move 合约更新 Oracle、触发 Vault 再平衡 |
| 调度器 | `backend/scheduler` | 定时主循环（每 5 分钟拉取 + 发布） |
| 前端 API | `backend/server` | 给前端提供聚合后的 REST 接口（前后端分离） |
| 配置 | `backend/config` | API 地址、Sui 网络、对象 ID 等集中配置 |

### contracts（链上合约）

| 模块 | 目录 | 功能 |
| --- | --- | --- |
| EvoOracle | `contracts/oracle` | 存储各资产风险评分 + AI 信号，授权更新、公开读取 |
| RiskVault | `contracts/risk_vault` | 读取 Oracle，按风险评分自动调整 SUI/USDC 仓位 |

### frontend（前端）

| 模块 | 目录 | 功能 |
| --- | --- | --- |
| Oracle 面板 | `frontend/src/modules/oracle_dashboard` | 链上信号实时监控 |
| Vault 界面 | `frontend/src/modules/vault_ui` | 存取款 + Protected vs Static 对比 |
| 历史回测 | `frontend/src/modules/backtest_view` | LUNA 崩盘期间的策略复盘可视化 |

## 数据流

```
EvoQuantV3 API (127.0.0.1:8000)
  GET /signals/{symbol}      综合信号
  GET /risk/score/{symbol}   风险评分
  GET /macro/regime          宏观情绪
  GET /sentiment/summary     新闻情感
  GET /time-slice/range      历史回测数据
        │
        ▼
backend/api_client  ──→  signal_processor  ──→  sui_publisher
        │                                              │
        │                                              ▼
        │                                    Sui: oracle::update_risk
        │                                    Sui: risk_vault::rebalance
        ▼
backend/server (前端 API) ◀── frontend (React Dashboard)
```

## 快速开始

```bash
# 1. 启动 EvoQuantV3 数据基座（另一个项目）
cd ../EvoQuantV3-main && python -m api.app --port 8000

# 2. 启动 EvoOracle 后端
cd backend && pip install -r requirements.txt
python -m scheduler.runner        # 启动 Bridge 调度
python -m server.app              # 启动前端 API（另开终端）

# 3. 启动前端
cd frontend && npm install && npm run dev
```

## 开发原则

1. **前后端分离** —— 前端只消费 `backend/server` 的 API 与 Sui 链，不耦合数据基座。
2. **模块化** —— 每个模块一个子文件夹，职责单一，可独立测试替换。
3. **文档先行** —— 每个模块文件夹必须有一份 `README.md` 记录其功能；**每次开发改动后必须同步更新对应模块的 md 和本文件**。
4. **不修改 EvoQuantV3** —— 数据基座是只读依赖，所有适配在本项目完成。

## 开发日志

| 日期 | 改动 | 涉及模块 |
| --- | --- | --- |
| 2026-05-30 | 初始化项目脚手架，建立三层结构与全部模块 md | 全部 |
| 2026-05-30 | 新增参赛提交文档 `SUBMISSION.md`（评委向） | 文档 |
