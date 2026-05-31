/// 自动调仓金库（Testnet 可操作版本）。
///
/// 读取 EvoOracle 风险评分，动态调整 SUI 仓位。
/// 用户可存入/取出真实 SUI（testnet），金库根据 Oracle 信号调整目标仓位。
module evo_oracle::risk_vault {
    use evo_oracle::oracle::{Self, RiskSnapshot};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::clock::Clock;
    use sui::event;

    /// Oracle 数据过期，拒绝再平衡。
    const E_STALE_ORACLE: u64 = 1;
    /// 取款金额超过余额。
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    /// 存款金额为零。
    const E_ZERO_AMOUNT: u64 = 3;

    /// 金库（共享对象）
    public struct Vault has key {
        id: UID,
        /// 金库持有的 SUI 余额
        sui_balance: Balance<SUI>,
        /// 目标 SUI 敞口百分比 (×100, e.g. 9000 = 90%)
        target_sui_pct: u64,
        /// 当前风险等级 (0-3)
        risk_level: u64,
        /// 是否为 Oracle 驱动的 Protected 金库
        is_protected: bool,
        /// 上次再平衡时间戳
        last_rebalance: u64,
        /// 总存入量（用于 PnL 计算）
        total_deposited: u64,
    }

    /// 目标仓位
    public struct Allocation has copy, drop {
        sui_pct: u64,
    }

    // ─── Events ───

    public struct DepositEvent has copy, drop {
        vault_id: ID,
        depositor: address,
        amount: u64,
        new_balance: u64,
    }

    public struct WithdrawEvent has copy, drop {
        vault_id: ID,
        withdrawer: address,
        amount: u64,
        remaining: u64,
    }

    public struct RebalanceEvent has copy, drop {
        vault_id: ID,
        old_target_pct: u64,
        new_target_pct: u64,
        risk_score: u64,
    }

    // ─── 创建金库 ───

    /// 创建金库。is_protected=true 为 Oracle 驱动，false 为固定 50/50 对比组。
    public fun create_vault(is_protected: bool, ctx: &mut TxContext) {
        let vault = Vault {
            id: object::new(ctx),
            sui_balance: balance::zero<SUI>(),
            target_sui_pct: 5000,
            risk_level: 0,
            is_protected,
            last_rebalance: 0,
            total_deposited: 0,
        };
        transfer::share_object(vault);
    }

    // ─── 用户操作 ───

    /// 存入 SUI 到金库。
    public fun deposit(
        vault: &mut Vault,
        coin: Coin<SUI>,
        ctx: &mut TxContext,
    ) {
        let amount = coin::value(&coin);
        assert!(amount > 0, E_ZERO_AMOUNT);

        let coin_balance = coin::into_balance(coin);
        balance::join(&mut vault.sui_balance, coin_balance);
        vault.total_deposited = vault.total_deposited + amount;

        event::emit(DepositEvent {
            vault_id: object::id(vault),
            depositor: ctx.sender(),
            amount,
            new_balance: balance::value(&vault.sui_balance),
        });
    }

    /// 从金库取出指定数量的 SUI。
    public fun withdraw(
        vault: &mut Vault,
        amount: u64,
        ctx: &mut TxContext,
    ): Coin<SUI> {
        assert!(amount > 0, E_ZERO_AMOUNT);
        let current = balance::value(&vault.sui_balance);
        assert!(current >= amount, E_INSUFFICIENT_BALANCE);

        let withdrawn = coin::from_balance(
            balance::split(&mut vault.sui_balance, amount),
            ctx,
        );

        event::emit(WithdrawEvent {
            vault_id: object::id(vault),
            withdrawer: ctx.sender(),
            amount,
            remaining: balance::value(&vault.sui_balance),
        });

        withdrawn
    }

    // ─── Oracle 驱动再平衡 ───

    /// 纯函数：风险评分 → 目标仓位。
    public fun compute_target(risk_score: u64): Allocation {
        if (risk_score < 2500) {
            Allocation { sui_pct: 9000 }
        } else if (risk_score < 5000) {
            Allocation { sui_pct: 6000 }
        } else if (risk_score < 7500) {
            Allocation { sui_pct: 3000 }
        } else {
            Allocation { sui_pct: 500 }
        }
    }

    /// 读取 Oracle 后再平衡目标仓位。
    public fun rebalance(
        vault: &mut Vault,
        snapshot: &RiskSnapshot,
        clock: &Clock,
        _ctx: &mut TxContext,
    ) {
        assert!(oracle::is_data_fresh(snapshot, clock), E_STALE_ORACLE);

        if (vault.is_protected) {
            let score = oracle::get_risk_score(snapshot);
            let old_pct = vault.target_sui_pct;
            let target = compute_target(score);
            vault.target_sui_pct = target.sui_pct;
            vault.risk_level = oracle::get_risk_level(snapshot);

            event::emit(RebalanceEvent {
                vault_id: object::id(vault),
                old_target_pct: old_pct,
                new_target_pct: target.sui_pct,
                risk_score: score,
            });
        };

        vault.last_rebalance = clock.timestamp_ms();
    }

    // ─── 公开读取接口 ───

    public fun get_balance(vault: &Vault): u64 {
        balance::value(&vault.sui_balance)
    }

    public fun get_target_sui_pct(vault: &Vault): u64 {
        vault.target_sui_pct
    }

    public fun get_risk_level(vault: &Vault): u64 {
        vault.risk_level
    }

    public fun is_protected(vault: &Vault): bool {
        vault.is_protected
    }

    public fun get_last_rebalance(vault: &Vault): u64 {
        vault.last_rebalance
    }

    public fun get_total_deposited(vault: &Vault): u64 {
        vault.total_deposited
    }
}
