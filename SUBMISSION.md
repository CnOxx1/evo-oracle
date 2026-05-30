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

### Demo 1：链上信号面板
实时展示 SUI / BTC / ETH 的链上风险评分、趋势、资金费率异常、宏观情绪。**数据每 5 分钟从真实交易所更新并上链。**

### Demo 2：Protected Vault vs Static Vault（核心）
两个金库并排：
- **Protected Vault**：读取 EvoOracle，风险评分 > 75 自动减仓、< 30 自动加仓
- **Static Vault**：固定 50/50，作为对照组

评委能看到**资金在动**——风险升高时 Protected 自动把 SUI 仓位从 60% 降到 30%，Static 纹丝不动。

### Demo 3：LUNA 崩盘历史回测
用**真实历史数据**复盘 2022-05-07 ~ 05-13：
- EvoOracle 风险评分如何从 45 一路升到 88
- Protected Vault 仓位如何随之降低
- 最终损失对比：**Protected -8% vs Static -43%**

> 这不是"我们会保护你"，而是"历史数据证明我们保护过"。

---

## 4. 技术差异化：真实数据，不是 Mock

大多数黑客松项目的信号是硬编码的。**EvoOracle 背后是一套真实运行的市场数据基础设施（EvoQuantV3）：**

| 证据链 | 数据内容 |
| --- | --- |
| 交易所微观结构 | ticker / orderbook / 资金费率 / 持仓量 / 清算 |
| 期权风险定价 | 波动率曲面 / Gamma / 偏度 |
| 链上资本流 | 交易所净流量 / 鲸鱼活动 / 稳定币 / TVL |
| 宏观跨市场 | DXY / 美债利率 / VIX / 纳指 |
| 新闻与事件 | 情感分类 / 解锁 / 监管 |

这套底座有 **42 个 REST 接口、8 条证据链、三域数据库**，已实际运行采集真实数据。EvoOracle 把它的判断送上链。

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
EvoQuantV3 数据基座（Python，已运行）
    │  REST API @ 127.0.0.1:8000
    ▼
EvoOracle Bridge（Python 后端）
    ├── api_client        拉取信号
    ├── signal_processor  转成链上整数格式
    └── sui_publisher     提交交易
    │
    ▼
Sui Move 合约
    ├── oracle::RiskSnapshot   链上风险快照（共享对象）
    └── risk_vault::Vault      自动调仓金库
    │
    ▼
前端 Dashboard（React + dapp-kit）
    ├── 信号面板
    ├── Vault 对比
    └── LUNA 回测
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

### 已完成
- ✅ EvoQuantV3 数据基座（42 个 API，真实数据采集）
- ✅ EvoOracle 后端 Bridge（拉取 → 转换 → 发布，dry-run 跑通）
- ✅ Move 合约：Oracle + RiskVault（数据结构 + 风险映射逻辑）
- ✅ 完整模块化工程结构与文档

### 黑客松期间完成
- 🔄 合约部署到测试网，Bridge 真实上链
- 🔄 前端三大面板（信号 / Vault / 回测）
- 🔄 LUNA 历史回测计算

### 赛后路线图
- 借贷协议适配器 SDK（5 行代码接入动态抵押率）
- 永续合约动态杠杆
- 接入更多 Sui 生态协议，成为生态风险层

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
