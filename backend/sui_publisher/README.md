# sui_publisher 模块

把转换后的 payload 提交到 Sui 链：更新 Oracle 对象、触发 RiskVault 再平衡。

## 功能

- 调用 Move 合约 `oracle::update_risk` 写入最新风险快照
- 调用 Move 合约 `risk_vault::rebalance` 触发 Vault 按新风险调仓
- 管理签名密钥、构造交易、签名并执行
- 返回交易 digest，供日志与前端展示

## 主要类 / 方法

| 方法 | 说明 |
| --- | --- |
| `SuiPublisher.update_oracle(payload)` | 提交 update_risk 交易 |
| `SuiPublisher.rebalance_vault()` | 提交 rebalance 交易 |
| `SuiPublisher.publish(payload)` | 组合调用：先更新 Oracle 再 rebalance |

## 依赖配置（config/settings.py）

- `sui_rpc_url`、`sui_network`
- `package_id`、`oracle_object_id`、`vault_object_id`、`oracle_admin_cap_id`
- 签名密钥来自本地 Sui keystore 或环境变量

## 当前状态

> ⚠️ 脚手架阶段：`publisher.py` 已定义完整接口与交易构造骨架。
> 真实链上提交需在 Move 合约部署、对象 ID 填入 config 后启用。
> 未配置对象 ID 时运行在 **dry-run 模式**，只打印 payload 不实际上链，方便先联调数据流。

## 用法

```python
from sui_publisher.publisher import SuiPublisher

publisher = SuiPublisher()
digest = await publisher.publish(payload)   # dry-run 或真实上链
```

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 初始化发布器，含 dry-run 模式与交易构造骨架 |
