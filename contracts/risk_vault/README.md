# risk_vault 模块（Move）

自动调仓金库。读取 EvoOracle 的风险评分，动态调整 SUI/USDC 目标仓位。是 Demo 的核心：直观展示「有 Oracle 保护 vs 固定策略」的差异。

## 数据结构

### Vault（共享对象）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `total_usdc` | `u64` | USDC 余额 |
| `total_sui` | `u64` | SUI 余额 |
| `target_sui_pct` | `u64` | 目标 SUI 比例 ×100 |
| `target_usdc_pct` | `u64` | 目标 USDC 比例 ×100 |
| `is_protected` | `bool` | true=Oracle 驱动 / false=固定 50/50（对比组） |
| `last_rebalance` | `u64` | 上次再平衡时间戳 |

## 风险评分 → 目标仓位映射

| risk_score | 风险 | SUI | USDC |
| --- | --- | --- | --- |
| 0–2500 | low | 90% | 10% |
| 2500–5000 | medium | 60% | 40% |
| 5000–7500 | high | 30% | 70% |
| 7500–10000 | extreme | 5% | 95% |

## 函数

| 函数 | 说明 |
| --- | --- |
| `create_vault(is_protected, ctx)` | 创建一个金库（Protected 或 Static） |
| `deposit(vault, usdc, ctx)` | 用户存入 USDC |
| `withdraw(vault, share_pct, ctx)` | 按比例取款 |
| `rebalance(vault, snapshot, clock, ctx)` | 读取 Oracle 后再平衡 |
| `compute_target(risk_score)` | 纯函数：评分 → 目标仓位 |

## 保护逻辑

```
rebalance():
  断言 oracle::is_data_fresh(snapshot)   ← 拒绝过期数据
  if is_protected:
      score = oracle::get_risk_score(snapshot)
      (sui_pct, usdc_pct) = compute_target(score)
  else:
      保持 50/50
  执行资产调换
```

## 当前状态

> ⚠️ 脚手架阶段：仓位计算与状态管理已实现；
> 实际的 Coin<USDC> / Coin<SUI> 处理与 DEX swap 标记为 TODO，联调时接入。

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 定义 Vault 结构、仓位映射与 rebalance 骨架 |
