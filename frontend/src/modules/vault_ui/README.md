# vault_ui 模块

金库界面。用户存取款，并并排对比「Protected Vault（Oracle 驱动）」与「Static Vault（固定 50/50）」。这是 Demo 最有冲击力的页面——评委看到资金在动。

## 展示内容

- 两个金库并排卡片：
  - 当前仓位（SUI% / USDC%）
  - Protected 标注「自动调整」，Static 标注「固定」
  - 收益（7d PnL）、最大回撤
  - 存入 / 取款按钮
- 收益对比折线图（过去 30 天，Recharts）

## 用户操作

1. 连接钱包（dapp-kit）
2. 选择金库 → 存入 USDC → 调用 `risk_vault::deposit`
3. 取款 → 调用 `risk_vault::withdraw`

> 进阶（优化项）：接入 zkLogin，让评委用 Google 登录 + 赞助交易零门槛体验。

## 数据来源

- `api.getVaultState()` → 后端 `GET /api/vault/state`
- 链上：`lib/vaultReader` 读取两个 Vault 对象

## 组件计划

| 组件 | 说明 |
| --- | --- |
| `VaultUI.tsx` | 模块容器 |
| `VaultCard.tsx` | 单金库卡片（含存取款） |
| `PnLCompareChart.tsx` | Protected vs Static 收益对比图 |

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 定义模块职责、用户操作与组件清单（待实现） |
| 2026-05-31 | ✅ 实现 VaultUI.tsx、VaultCard.tsx、PnLCompareChart.tsx（Recharts） |
