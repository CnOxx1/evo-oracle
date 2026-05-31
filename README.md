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
| 可解释风险评分 | `backend/risk_composer` | 多证据链加权合成风险分 + 贡献拆解 |
| 异常告警 | `backend/alert_engine` | 从信号中检测风险事件，分级告警 |
| 信号处理 | `backend/signal_processor` | 把 API 返回数据转换成链上整数格式 |
| Sui 发布 | `backend/sui_publisher` | 调用 Move 合约更新 Oracle、触发 Vault 再平衡 |
| 调度器 | `backend/scheduler` | 定时主循环（每 5 分钟拉取 + 发布） |
| 前端 API | `backend/server` | 给前端提供聚合后的 REST 接口（前后端分离） |
| 配置 | `backend/config` | API 地址、Sui 网络、对象 ID 等集中配置 |
| 传导图引擎 | `backend/contagion_engine` | 跨资产风险传导图（相关性矩阵 + 板块轮动 + 组合风险） |
| 清算保护 | `backend/liquidation_shield` | 清算级联保护（OI + 资金费率 + VaR + 相关性） |
| 鲸鱼信号 | `backend/whale_signal` | 鲸鱼风险信号（RS 突变 + 资金流向 + 资金费率） |
| 压力测试 | `backend/stress_test` | 冲击传导模拟器（相关性×beta 计算全组合损失 + 级联清算估算） |
| 清算预测 | `backend/predictive_liq` | 预测性清算告警（OI增速/资金费率/相关性集中度/波动率四因子sigmoid概率） |
| 多协议联动 | `backend/protocol_aggregator` | 一信号同时驱动 Lending LTV / Perp 杠杆 / Vault 仓位 |
| 调仓演示 | `backend/rebalancer_demo` | 三场景（正常/压力/崩盘）24h 时间序列调仓动画数据 |

### contracts（链上合约）

| 模块 | 目录 | 功能 |
| --- | --- | --- |
| EvoOracle | `contracts/oracle` | 存储各资产风险评分 + AI 信号，授权更新、公开读取 |
| RiskVault | `contracts/risk_vault` | 读取 Oracle，按风险评分自动调整 SUI/USDC 仓位 |
| Alert | `contracts/alert` | 把异常作为链上 event 发出，协议可订阅 |
| LendingAdapter | `contracts/adapters/lending_adapter` | 借贷协议接入示例：动态 LTV |
| PerpAdapter | `contracts/adapters/perp_adapter` | 永续协议接入示例：动态最大杠杆 |

### frontend（前端）

| 模块 | 目录 | 功能 |
| --- | --- | --- |
| 登录 (zkLogin) | `frontend/src/modules/auth` | Google 一键登录，无需钱包 |
| Oracle 面板 | `frontend/src/modules/oracle_dashboard` | 链上信号实时监控 |
| 风险拆解 | `frontend/src/modules/risk_breakdown` | 可解释风险评分可视化 |
| 告警流 | `frontend/src/modules/alert_feed` | 实时异常告警流 |
| Vault 界面 | `frontend/src/modules/vault_ui` | 存取款 + Protected vs Static 对比 |
| 历史回测 | `frontend/src/modules/backtest_view` | LUNA 崩盘期间的策略复盘可视化 |
| 传导图 | `frontend/src/modules/contagion_map` | 跨资产风险传导图可视化 |
| 清算保护 | `frontend/src/modules/liquidation_shield` | 清算级联保护面板 |
| 鲸鱼信号 | `frontend/src/modules/whale_signal` | 大资金动向推断 |
| 压力测试 | `frontend/src/modules/stress_test` | 冲击传导模拟器（选资产+幅度，实时计算全组合损失） |
| 清算预测 | `frontend/src/modules/predictive_liq` | 4因子加权预测未来4h清算概率 |
| 多协议联动 | `frontend/src/modules/protocol_agg` | 一信号同时驱动 Lending/Perp/Vault 参数对比 |
| 调仓演示 | `frontend/src/modules/rebalancer_demo` | 三场景24h时间序列调仓动画 |

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
| 2026-05-30 | 新增亮点功能：可解释风险评分、异常告警（后端真实实现）、链上 Alert event、借贷动态 LTV 适配器、前端风险拆解/告警流模块 | backend / contracts / frontend |
| 2026-05-30 | 适配器升级为多协议：新增 perp_adapter（动态最大杠杆）；新增 zkLogin 登录（auth 模块 + lib/zkLogin.ts），Demo 免钱包 | contracts / frontend |
| 2026-05-31 | **Demo-ready 完成**：前端全部 6 模块组件实现（OracleDashboard、RiskBreakdown、AlertFeed、VaultUI、BacktestView、Auth）；后端补全 vault/state 和 backtest/luna 端点；sui_publisher 集成 pysui；Vite 构建基础设施 + App Shell | frontend / backend |
| 2026-05-31 | 新增四大高级模块：压力测试模拟器（冲击传导+级联清算）、预测性清算告警（4因子sigmoid概率）、多协议联动（一信号三协议保护）、实时调仓演示（三场景24h动画）；前端扩展至 12 Tab，后端 12 API 端点 | backend / frontend |
