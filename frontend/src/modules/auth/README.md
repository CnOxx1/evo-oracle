# auth 模块（zkLogin）

零门槛登录。评委用 Google 账号登录即可获得 Sui 地址并签名交易，**无需安装钱包、无需助记词**。这是 Demo 成功率的关键保障。

## 为什么重要

```
传统流程：评委 → 装钱包插件 → 创建账号 → 抄助记词 → 领测试币 → 才能体验
                                          ↑ 大多数人卡在这里

zkLogin：  评委 → 点 "Google 登录" → 10 秒后已有 Sui 地址 → 直接体验
```

## zkLogin 流程（本模块封装）

```
1. 生成临时密钥对（ephemeral keypair）
2. 取当前 epoch，设定 maxEpoch（密钥有效期）
3. 生成 randomness + nonce
4. 跳转 Google OAuth（携带 nonce）
5. 回调拿到 JWT
6. 用 JWT + salt 派生 zkLogin 地址（jwtToAddress）
7. 向 prover 服务请求 zkProof
8. 用 zkProof + 临时密钥签名交易
```

具体实现见 [`../../lib/zkLogin.ts`](../../lib/zkLogin.ts)。

## 展示内容

- 未登录：一个「使用 Google 登录」按钮
- 已登录：显示派生出的 Sui 地址、剩余有效 epoch
- 登录后即可在 vault_ui 中存款，全程无钱包

## 配置（环境变量）

| 变量 | 说明 |
| --- | --- |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `VITE_ZK_PROVER_URL` | zkLogin prover 服务地址（Mysten 提供 devnet/testnet prover） |
| `VITE_SALT_SERVICE_URL` | salt 服务（可自建或用临时固定 salt 做 Demo） |

## 进阶：赞助交易（免 Gas）

配合后端赞助交易服务，用户存款的 Gas 由平台代付，体验完全零成本。
> 赞助交易后端为后续可选增强项。

## 组件计划

| 组件 | 说明 |
| --- | --- |
| `AuthProvider.tsx` | zkLogin 状态上下文（地址、JWT、ephemeral key） |
| `LoginButton.tsx` | Google 登录按钮 |
| `useZkLogin.ts` | 封装登录/登出/签名的 hook |

## 当前状态

> ⚠️ 脚手架：流程封装在 `lib/zkLogin.ts`（真实可用的工具函数）。
> React 组件待前端工程初始化后接入。需要先申请 Google OAuth Client ID。

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 定义 zkLogin 模块，封装登录流程与配置项 |
