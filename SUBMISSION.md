# EvoOracle — 参赛提交文档

> **赛道**：DeFi / 基础设施
> **公链**：Sui
> **一句话**：把机构级市场数据通过 AI 聚合后实时写入 Sui 链，让 DeFi 协议的风险参数从「静态」变成「动态」。

---

## 1. 我们解决什么问题

**2022 年 5 月，LUNA/UST 在 72 小时内从 800 亿美元市值归零。**

崩盘期间，几乎所有借贷与杠杆协议都遭受了级联清算。根本原因不是没有预言机——价格预言机工作得很好——而是：

> **DeFi 协议的风险参数是「静态」的。** 抵押率、最大杠杆、清算线在部署时写死，市场风险飙升时它们纹丝不动，等到清算触发，为时已晚。

传统金融用波动率曲面、宏观因子、期权定价实时调整风险敞口。**DeFi 几乎完全缺失这一层。**

---

## 2. 我们的方案

EvoOracle 是 Sui 上的**风险预言机 + 自动调仓引擎**：

```
真实市场数据（交易所 / 期权 / 链上 / 宏观 / 新闻）
        ↓  AI 聚合成风险评分
    写入 Sui 链（EvoOracle 合约）
        ↓  任何协议可读取
动态风险参数：抵押率 / 仓位 / 杠杆自动调整
```

核心理念：**价格预言机告诉你"现在多少钱"，EvoOracle 告诉你"现在有多危险"。**

---

## 3. 评委可以现场看到什么（Demo）

### Demo 1：压力测试模拟器（Stress Test）
输入"BTC 跌 30%"，系统基于 18×18 相关性矩阵 + beta 系数**实时计算**：
- 全组合各资产预期损失瀑布图
- 级联清算风险等级
- 预估清算金额（USD）

评委可以拖动滑块改变冲击幅度，看损失如何非线性放大。

### Demo 2：预测性清算告警（Predictive Liquidation）
不是"爆仓了再告诉你"，而是**预测未来 4 小时哪些资产会爆仓**：
- 4 因子加权模型：OI 增速(30%) + 资金费率方向(25%) + 相关性集中度(20%) + 波动率(25%)
- Sigmoid 平滑输出概率，避免极端值
- 全局级联概率 = 单资产概率 × 高风险资产数量放大系数

### Demo 3：一信号三协议联动（Multi-Protocol Protection）
**一个 Oracle 风险评分，同时保护三个协议**：
- Lending：LTV 从 80% 动态收紧至 30%
- Perp：最大杠杆从 20x 降至 2x
- Vault：SUI 敞口从 80% 降至 5%

对比展示"有 Oracle 保护" vs "无 Oracle 保护"的参数差异。

### Demo 4：实时调仓动画（Rebalancer Demo）
三种场景（正常 / 压力 / 崩盘）24 小时时间序列动画：
- 风险评分曲线 + SUI 仓位曲线双轴联动
- 每次调仓动作标注触发原因
- 统计：调仓次数、最高风险、最终仓位

### Demo 5：LUNA 崩盘交互式回测
用**真实历史数据**复盘 2022-05-07 ~ 05-13：
- 参数化模拟：用户可调退出阈值、减仓阈值、初始仓位
- 实时对比 Protected vs Static 策略
- 最终损失对比：**Protected -8% vs Static -43%**

### Demo 6：跨资产风险传导图
18 个资产的相关性网络图 + 板块轮动分析：
- 高相关链接（传导风险）vs 负相关链接（对冲机会）
- 板块级联风险评估
- 系统性风险评分

---

## 4. 技术差异化

### 4.1 真实数据，不是 Mock

EvoOracle 背后是一套真实运行的市场数据基础设施（EvoQuantV3，100+ REST 接口）：

| 证据链 | 数据内容 |
| --- | --- |
| 交易所微观结构 | ticker / orderbook / 资金费率 / 持仓量(OI) / 清算 |
| 期权风险定价 | 波动率曲面 / Gamma / 偏度 |
| 链上资本流 | 交易所净流量 / 鲸鱼活动 / 稳定币 / TVL |
| 宏观跨市场 | DXY / 美债利率 / VIX / 纳指 |
| 新闻与事件 | 情感分类 / 解锁 / 监管 |
| 相对强弱 | 18 资产 RS 排名 + 板块轮动 |
| 组合风险 | VaR / 相关性矩阵 / 波动率 |

### 4.2 算法深度（不是套壳 API）

| 模块 | 核心算法 |
| --- | --- |
| 压力测试 | `expected_loss = shock_pct × correlation × beta`，18 资产 beta 建模 + 2x-20x 杠杆均匀分布清算估算 |
| 清算预测 | 4 因子加权 → sigmoid 平滑：`P = sigmoid((raw - 50) / 15) × 100` |
| 级联保护 | `risk = (funding_extremity × 0.4 + OI_factor × 0.6) × cascade_multiplier`，cascade_multiplier 基于相关性放大 |
| 传导图 | 18×18 相关性矩阵 → 图结构（nodes/edges/clusters），板块内相关性 + 动量评分 |
| 风险评分 | 5 证据链加权合成（波动率 30% + 宏观 20% + 趋势 20% + 资金费率 15% + 情绪 15%） |
| 调仓演示 | 高斯噪声 + 确定性漂移生成随机风险路径，偏离阈值 > 5% 触发调仓 |

### 4.3 工程完成度

| 指标 | 数量 |
| --- | --- |
| 后端引擎模块 | 14 个 |
| API 端点 | 14 个 |
| 前端功能 Tab | 12 个 |
| Move 合约模块 | 5 个 |
| EvoQuantV3 接口集成 | 30+ |
| TypeScript 类型定义 | 完整覆盖 |

---

## 5. 为什么是 Sui

| Sui 特性 | EvoOracle 如何利用 |
| --- | --- |
| **对象模型** | 每个资产的风险快照是独立共享对象，协议直接持有引用读取，比 mapping 更清晰 |
| **能力（Capability）** | `OracleAdminCap` 门控更新权限，防止信号伪造 |
| **共享对象并发** | 多协议可同时读取同一风险快照，高吞吐 |
| **zkLogin + 赞助交易** | 评委用 Google 登录、平台代付 Gas，零门槛体验 Vault（优化项） |

---

## 6. 架构

```
EvoQuantV3 数据基座（Python，100+ REST 接口，已运行）
    │  REST API @ 127.0.0.1:8000
    ▼
EvoOracle Backend（14 个引擎模块）
    ├── api_client           统一数据拉取
    ├── risk_composer        5因子可解释评分
    ├── alert_engine         6类异常检测
    ├── contagion_engine     跨资产传导图
    ├── liquidation_shield   级联清算保护
    ├── whale_signal         鲸鱼行为推断
    ├── stress_test          压力测试模拟
    ├── predictive_liq       清算概率预测
    ├── protocol_aggregator  多协议联动
    ├── rebalancer_demo      调仓动画数据
    ├── signal_processor     链上格式转换
    └── sui_publisher        提交交易
    │
    ▼
Sui Move 合约（5 个模块）
    ├── oracle::RiskSnapshot      链上风险快照（共享对象）
    ├── risk_vault::Vault         自动调仓金库（真实 Balance<SUI>）
    ├── perp_adapter::PerpMarket  动态最大杠杆
    ├── lending_adapter::LendingMarket  动态 LTV
    └── alert::RiskAlert          链上告警事件
    │
    ▼
前端 Dashboard（React + TypeScript + Recharts）
    12 个功能 Tab + zkLogin 登录
```

**工程原则**：前后端分离、模块化（每模块独立文件夹 + 文档）、不修改数据基座。

---

## 7. 商业模式

EvoOracle 是协议层基础设施，变现路径清晰：

| 层级 | 内容 | 定价 |
| --- | --- | --- |
| Free | 延迟 1 小时信号、仅 BTC/ETH | 免费 |
| Pro | 实时信号、全部资产、历史回溯 | 订阅 |
| Institutional | 原始数据 API、自定义告警、SLA | 订阅 NFT |

接入方（借贷协议、永续 DEX、策略金库）按调用或订阅付费。对标 **Chainlink（预言机）+ Gauntlet（风险参数）**，但原生在 Sui。

---

## 8. 已完成 vs 规划（诚实边界）

### ✅ 已完成（全部可运行）
- ✅ EvoQuantV3 数据基座（100+ REST 接口，真实数据采集）
- ✅ EvoOracle 后端 14 个引擎模块（风险评分 / 传导图 / 清算保护 / 鲸鱼信号 / 压力测试 / 清算预测 / 多协议联动 / 调仓演示 / 告警 / 回测）
- ✅ FastAPI 服务 14 个端点，带缓存和错误处理
- ✅ Move 合约 5 个模块：Oracle + RiskVault + PerpAdapter + LendingAdapter + Alert
- ✅ 前端 12 个功能 Tab + zkLogin 登录
- ✅ LUNA 崩盘交互式参数化回测
- ✅ 完整 TypeScript 类型定义 + 暗色主题 UI

### 🔄 优化中
- 合约部署到 Sui 测试网，Bridge 真实上链
- 前端 zkLogin 完整流程联调

### 赛后路线图
- 协议适配器 SDK（5 行代码接入动态风险参数）
- 接入更多 Sui 生态协议（Scallop、Cetus、Turbos）
- 历史回测扩展：FTX 崩盘、硅谷银行事件

---

## 9. 团队

核心成员具备 **量化交易 + 网络安全** 双背景：

- **量化**：风险建模、波动率计算、组合风险——EvoOracle 的信号质量来源
- **安全**：攻击者视角、异常检测——风险评分与告警逻辑的设计基础

这个组合让我们能做别人做不了的事：既懂如何量化市场风险，也懂如何识别异常与防御。

---

## 10. 愿景

> DeFi 的下一个十年，风险管理会像价格预言机一样成为标配基础设施。
>
> EvoOracle 要成为 Sui 生态的风险层——让每一个协议，5 行代码，把固定参数变成会呼吸的动态参数。

---

## 附录：快速验证

```bash
# 1. 启动数据基座
cd EvoQuantV3-main && python -m api.app --port 8000

# 2. 启动 EvoOracle Bridge（dry-run，打印链上 payload）
cd evo-oracle/backend && python -m scheduler.runner

# 3. 启动前端 API + Dashboard
python -m server.app --port 8100
cd ../frontend && npm run dev
```

- 项目结构与模块文档：见 [`README.md`](README.md)
- 后端：[`backend/README.md`](backend/README.md)
- 合约：[`contracts/README.md`](contracts/README.md)
- 前端：[`frontend/README.md`](frontend/README.md)
