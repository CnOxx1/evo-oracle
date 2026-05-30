/// 自动调仓金库。
///
/// 读取 EvoOracle 风险评分，动态调整 SUI/USDC 目标仓位。
/// Protected 金库由 Oracle 驱动；Static 金库固定 50/50，作为对比组。
module evo_oracle::risk_vault {
    use evo_oracle::oracle::{Self, RiskSnapshot};
    use sui::clock::Clock;

    /// Oracle 数据过期，拒绝再平衡。
    const E_STALE_ORACLE: u64 = 1;

    /// 金库（共享对象）
    public struct Vault has key {
        id: UID,
        total_usdc: u64,
        total_sui: u64,
        target_sui_pct: u64,    // ×100
        target_usdc_pct: u64,   // ×100
        is_protected: bool,
        last_rebalance: u64,
    }

    /// 目标仓位
    public struct Allocation has copy, drop {
        sui_pct: u64,
        usdc_pct: u64,
    }

    /// 创建金库。is_protected=true 为 Oracle 驱动，false 为固定 50/50 对比组。
    public fun create_vault(is_protected: bool, ctx: &mut TxContext) {
        let vault = Vault {
            id: object::new(ctx),
            total_usdc: 0,
            total_sui: 0,
            target_sui_pct: 5000,
            target_usdc_pct: 5000,
            is_protected,
            last_rebalance: 0,
        };
        transfer::share_object(vault);
    }

    /// 纯函数：风险评分 → 目标仓位。
    public fun compute_target(risk_score: u64): Allocation {
        if (risk_score < 2500) {
            Allocation { sui_pct: 9000, usdc_pct: 1000 }
        } else if (risk_score < 5000) {
            Allocation { sui_pct: 6000, usdc_pct: 4000 }
        } else if (risk_score < 7500) {
            Allocation { sui_pct: 3000, usdc_pct: 7000 }
        } else {
            Allocation { sui_pct: 500, usdc_pct: 9500 }
        }
    }

    /// 读取 Oracle 后再平衡。
    public fun rebalance(
        vault: &mut Vault,
        snapshot: &RiskSnapshot,
        clock: &Clock,
        _ctx: &mut TxContext,
    ) {
        // 拒绝过期数据，防止 Oracle 停更导致误判
        assert!(oracle::is_data_fresh(snapshot, clock), E_STALE_ORACLE);

        if (vault.is_protected) {
            let score = oracle::get_risk_score(snapshot);
            let target = compute_target(score);
            vault.target_sui_pct = target.sui_pct;
            vault.target_usdc_pct = target.usdc_pct;
        };
        // 否则保持初始 50/50

        // TODO: 根据 target 与当前余额执行实际 DEX swap / 内部记账
        vault.last_rebalance = clock.timestamp_ms();
    }

    /// 用户存入 USDC（脚手架：仅记账，Coin 处理待接入）。
    public fun deposit(vault: &mut Vault, amount_usdc: u64, _ctx: &mut TxContext) {
        // TODO: 接收 Coin<USDC>，并入金库
        vault.total_usdc = vault.total_usdc + amount_usdc;
    }

    // ---- 公开读取接口 ----

    public fun get_target_sui_pct(vault: &Vault): u64 { vault.target_sui_pct }

    public fun get_target_usdc_pct(vault: &Vault): u64 { vault.target_usdc_pct }

    public fun is_protected(vault: &Vault): bool { vault.is_protected }

    public fun get_last_rebalance(vault: &Vault): u64 { vault.last_rebalance }
}
