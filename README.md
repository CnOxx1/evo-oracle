# EvoOracle — The Risk Oracle for Sui

> Sui 生态首个 AI 驱动的链上风险预言机，实时评估 DeFi 协议风险并动态调整参数，防止 LUNA 式级联崩盘。

## 为什么需要 EvoOracle？

2022 年 LUNA/UST 崩盘，72 小时蒸发 $40B+。根本原因：固定 LTV 清算机制在极端行情下完全失效，没有协议提前预警。

**EvoOracle 解决方案**：将 AI 风险评分作为链上基础设施，一个信号同时驱动 Lending LTV / Perp 杠杆 / Vault 仓位。

## 核心亮点

| 亮点 | 说明 |
|------|------|
| Sui 生态首个风险预言机 | 填补生态空白，不是价格预言机，是**风险**预言机 |
| 多协议联动 | 一个 Oracle 信号 → Lending LTV(80%→30%) + Perp 杠杆(20x→2x) + Vault 仓位(80%→10%) |
| 可解释风险评分 | 5 因子加权：波动率30% + 宏观20% + 趋势20% + 资金费率15% + 情绪15% |
| LUNA 回测验证 | Protected -8% vs Static -43%，验证保护效果 |
| 21 个功能模块 | 完整覆盖 DeFi 风险管理全流程 |
| 端到端完整 | 数据采集 → 风险引擎 → 链上合约 → 可视化前端 |

## 项目规模

| 层 | 文件数 | 代码行数 | 模块数 |
|----|--------|----------|--------|
| Smart Contracts (Sui Move) | 10 | 1,400+ | 5 |
| Backend (Python/FastAPI) | 40 | 3,300+ | 14 引擎 |
| Frontend (React/TypeScript) | 51 | 4,100+ | 21 Tab |
| **合计** | **101** | **8,800+** | **27 API 端点** |

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│ EvoQuantV3 数据基座 (100+ REST 端点)                         │
│ 交易所微结构 · 期权Greeks · 链上流量 · 宏观 · 情绪 · RS      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ EvoOracle Backend (FastAPI + 14 风险引擎 + SQLite 历史存储)  │
│                                                             │
│ risk_composer · alert_engine · contagion_engine              │
│ liquidation_shield · whale_signal · stress_test             │
│ predictive_liq · protocol_aggregator · cascade_simulator    │
│ history_store · portfolio_tracker · macro_detail            │
│ scheduler (5min) · signal_processor · sui_publisher         │
└──────────────────────────┬──────────────────────────────────┘
                           │ Sui SDK (pysui)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Sui Move Contracts (5 模块)                                  │
│                                                             │
│ Oracle (SharedObject) → RiskVault (动态调仓)                 │
│                       → LendingAdapter (动态 LTV)            │
│                       → PerpAdapter (动态杠杆)               │
│                       → Alert (链上事件)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ Sui RPC
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend (React + TypeScript + Tailwind)                     │
│ Landing Page + 21 Tab Dashboard                             │
│ 概览 · Portfolio · 趋势 · Oracle · 风险分解 · 传导图 ·      │
│ 清算保护 · 清算瀑布 · 清算热图 · 鲸鱼 · 压力测试 ·          │
│ 清算预测 · 宏观 · 多协议 · 协议排名 · 调仓 · 告警规则 ·    │
│ 告警 · Vault · 收益归因 · 回测                              │
└─────────────────────────────────────────────────────────────┘
```

## 竞争优势分析

### vs 传统价格预言机（Pyth / Switchboard）

| 对比维度 | Pyth / Switchboard | EvoOracle |
|----------|-------------------|-----------|
| 输出 | 价格 feed | 风险评分 (0-100) |
| 数据维度 | 1 维（价格） | 5 维（波动率+宏观+趋势+资金费率+情绪） |
| 协议联动 | 无 | Lending + Perp + Vault 同步响应 |
| 预警能力 | 无 | 级联模拟 + 清算预测 + 鲸鱼监控 |
| 回测验证 | 无 | LUNA 事件 -8% vs -43% |

### vs 链下风控平台（Gauntlet / Chaos Labs）

| 对比维度 | Gauntlet | EvoOracle |
|----------|----------|-----------|
| 部署位置 | 链下报告 | 链上 SharedObject |
| 响应速度 | 人工审批 (天级) | 自动触发 (分钟级) |
| 覆盖生态 | Ethereum 为主 | Sui 原生 |
| 开源 | 否 | 完全开源 |

## 算法深度

### 5 因子风险评分模型

```
RiskScore = 0.30 × Volatility + 0.20 × Macro + 0.20 × Trend + 0.15 × FundingRate + 0.15 × Sentiment

其中：
- Volatility: 已实现波动率 vs 隐含波动率偏差
- Macro: BTC 主导度 + 稳定币流出 + DXY 相关性
- Trend: EMA 交叉 + RSI 极值 + 成交量异常
- FundingRate: 永续合约资金费率偏离 + 持仓量变化
- Sentiment: 社交情绪指数 + 恐慌贪婪指数
```

### 级联传导模拟

```python
# 5 轮迭代模拟清算级联
for round in range(5):
    for asset in affected_assets:
        impact = initial_shock * correlation_matrix[source][asset] * (0.7 ** round)
        if impact > liquidation_threshold[asset]:
            trigger_cascade(asset)
```

### 动态参数调整公式

```
LTV_new = LTV_base × (1 - risk_score / 100)
# risk=0  → LTV=80% (正常)
# risk=50 → LTV=40% (警戒)
# risk=80 → LTV=16% (极端)

Leverage_new = max_leverage × (1 - risk_score / 100)
# risk=0  → 20x
# risk=50 → 10x
# risk=80 → 4x
```

## Sui 链特性深度利用

| Sui 特性 | EvoOracle 利用方式 |
|----------|-------------------|
| Shared Objects | Oracle 评分作为 SharedObject，多协议并发读取无锁 |
| Move 线性类型 | RiskVault 的 Coin 资产安全保证 |
| 动态字段 (Dynamic Fields) | Oracle 按 symbol 动态存储评分，支持无限扩展 |
| Events | Alert 模块发射链上事件，前端/Indexer 可订阅 |
| PTB (Programmable Transaction Blocks) | 一笔交易内完成：读 Oracle → 调 LTV → 调杠杆 → 调仓位 |
| Object-centric Model | 每个 Vault/Adapter 独立 Object，权限隔离 |

## Demo 策略建议

### 3 分钟 Demo 脚本

1. **开场 (30s)** — LUNA 崩盘数据 → 引出问题
2. **架构 (30s)** — 三层架构图 → 强调 Sui 原生
3. **实时演示 (60s)** — Dashboard 概览 → Oracle 评分 → 风险分解 → 传导图
4. **联动触发 (30s)** — 模拟风险升高 → 看 LTV / 杠杆 / 仓位同步变化
5. **LUNA 回测 (20s)** — 对比数据：Protected -8% vs Static -43%
6. **结尾 (10s)** — "EvoOracle: Don't let the next LUNA happen on Sui"

### 重点突出

- **讲故事**：以 LUNA 崩盘开场，用数据冲击裁判
- **真实数据**：接入 EvoQuantV3 100+ 数据源，不是 mock 数据
- **链上可验证**：Move 合约已编译，SharedObject 设计经过深思
- **完整度碾压**：21 个功能模块，8800+ 行代码，端到端闭环

## 功能模块一览

### 前端 21 Tab

| # | 模块 | 功能 |
|---|------|------|
| 1 | 概览 Overview | 系统风险分 + 资产卡片 + 告警摘要 |
| 2 | Portfolio | 持仓风险分析 + 漂移可视化 + 再平衡建议 |
| 3 | 风险趋势 History | 历史风险评分时序图 + 数据表 |
| 4 | Oracle Dashboard | 各资产实时评分 + 风险条 |
| 5 | 风险分解 Breakdown | 5 因子贡献度可视化 |
| 6 | 传导图 Contagion | 资产间相关性热力图 + 集群列表 |
| 7 | 清算保护 Shield | 动态 LTV 状态 + 资产风险表 |
| 8 | 级联模拟 Cascade | 交互式清算瀑布模拟 |
| 9 | 清算热图 Heatmap | 交易所 × 杠杆倍数密度图 |
| 10 | 鲸鱼信号 Whale | 大户异动监控 + 偏向指标 |
| 11 | 压力测试 Stress | 历史场景预设 + 自定义冲击 |
| 12 | 清算预测 Predictive | 概率预测 + 时间窗口 |
| 13 | 宏观指标 Macro | 市场体制判断 + 历史对比 |
| 14 | 多协议聚合 Protocol | 跨协议风险对比 |
| 15 | 协议排名 Compare | 风险调整后收益排名 |
| 16 | 调仓演示 Rebalancer | Vault 动态调仓动画 |
| 17 | 告警规则 Alert Rules | 自定义告警条件 CRUD |
| 18 | 告警流 Alert Feed | 实时告警列表 + 严重度 |
| 19 | Vault UI | 存取款 + PnL 对比图 |
| 20 | 收益归因 Attribution | Vault 收益来源分解 |
| 21 | LUNA 回测 Backtest | 历史事件回放 + 参数调节 |

### 后端 27 API 端点

| 端点 | 功能 |
|------|------|
| GET /api/overview | 系统概览（风险分、资产数、告警数） |
| GET /api/oracle | 各资产 Oracle 评分 |
| GET /api/risk-breakdown | 5 因子分解 |
| GET /api/contagion | 传导图数据 |
| GET /api/liquidation-shield | 清算保护状态 |
| GET /api/whale-signals | 鲸鱼信号 |
| GET /api/stress-test | 压力测试结果 |
| GET /api/predictive-liq | 清算预测 |
| GET /api/protocol-agg | 协议聚合 |
| GET /api/rebalancer | 调仓状态 |
| GET /api/alerts | 告警列表 |
| GET /api/vault | Vault 状态 |
| GET /api/backtest | 回测数据 |
| GET /api/history/{symbol} | 历史风险时序 |
| POST /api/cascade-simulator | 级联模拟 |
| GET /api/portfolio | 组合分析 |
| GET /api/alert-rules | 告警规则列表 |
| POST /api/alert-rules | 创建规则 |
| DELETE /api/alert-rules/{id} | 删除规则 |
| GET /api/protocol-comparison | 协议排名 |
| GET /api/macro/detail | 宏观详情 |
| GET /api/liquidation-heatmap | 清算热图 |
| GET /api/vault/attribution | 收益归因 |

## 数据流

```
EvoQuantV3 API ──→ Scheduler (每5分钟) ──→ risk_composer ──→ SQLite (历史存储)
                                                │
                                                ├──→ alert_engine ──→ 告警触发
                                                ├──→ contagion_engine ──→ 传导评估
                                                ├──→ liquidation_shield ──→ 清算保护
                                                └──→ sui_publisher ──→ 链上更新

Frontend ──→ FastAPI (27 端点) ──→ 各引擎实时计算 / SQLite 历史查询
```

## 技术栈

| 层 | 技术 |
|----|------|
| 智能合约 | Sui Move (2024 Edition) |
| 后端框架 | Python 3.11 + FastAPI + Uvicorn |
| 定时调度 | APScheduler (5 分钟间隔) |
| 数据存储 | SQLite (历史记录) |
| 数据源 | EvoQuantV3 (100+ REST 端点) |
| 前端框架 | React 18 + TypeScript + Vite |
| 样式方案 | Tailwind CSS 3 (深色科技风) |
| 链交互 | pysui (Python Sui SDK) |

## 快速开始

### 后端

```bash
cd backend
pip install -r requirements.txt

# 启动 API 服务
cd server && uvicorn app:app --reload --port 8000

# 启动定时调度（另一个终端）
cd scheduler && python runner.py
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

### 合约编译

```bash
cd contracts
sui move build
```

## 开源协议

MIT License

## 团队

EvoOracle Team — Built for Sui Hackathon

GitHub: https://github.com/CnOxx1/evo-oracle
