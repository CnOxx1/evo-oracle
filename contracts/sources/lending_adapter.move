/// 借贷协议适配器（可操作版本）。
///
/// 用户可存入 SUI 作为抵押品，借出额度由 EvoOracle 动态 LTV 决定。
/// 当抵押率低于清算线时，任何人可触发清算（获得清算奖励）。
/// 核心演示：Oracle 风险评分升高 → LTV 自动收紧 → 防止过度借贷 → 减少清算。
module evo_oracle::lending_adapter {
    use std::string::String;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::clock::Clock;
    use sui::event;
    use evo_oracle::oracle::{Self, RiskSnapshot};

    // ─── 错误码 ───
    const E_STALE_ORACLE: u64 = 1;
    const E_ZERO_AMOUNT: u64 = 2;
    const E_EXCEED_BORROW_LIMIT: u64 = 3;
    const E_INSUFFICIENT_COLLATERAL: u64 = 4;
    const E_NOT_LIQUIDATABLE: u64 = 5;
    const E_NO_DEBT: u64 = 6;
    const E_REPAY_TOO_MUCH: u64 = 7;

    /// 清算奖励比例 (×10000)，5% = 500
    const LIQUIDATION_BONUS: u64 = 500;
    /// 清算阈值相对 LTV 的溢价 (×10000)，LTV + 500 = 清算线
    const LIQUIDATION_THRESHOLD_PREMIUM: u64 = 500;

    // ─── 数据结构 ───

    /// 借贷市场（共享对象）
    public struct LendingMarket has key {
        id: UID,
        symbol: String,
        /// 当前最大 LTV (×10000, e.g. 8000 = 80%)
        current_max_ltv: u64,
        /// 是否由 Oracle 驱动
        is_oracle_driven: bool,
        /// 市场总存款池（供应方存入的 SUI）
        pool: Balance<SUI>,
        /// 上次 Oracle 同步时间
        last_updated: u64,
        /// 总借出量（用于统计）
        total_borrowed: u64,
        /// 清算次数
        liquidation_count: u64,
    }

    /// 用户仓位（每个用户独立持有）
    public struct Position has key, store {
        id: UID,
        /// 所属市场 ID
        market_id: ID,
        /// 抵押品余额
        collateral: Balance<SUI>,
        /// 借出金额（以 SUI 计价，简化模型）
        debt: u64,
    }

    // ─── Events ───

    public struct DepositEvent has copy, drop {
        market_id: ID,
        user: address,
        amount: u64,
    }

    public struct BorrowEvent has copy, drop {
        market_id: ID,
        user: address,
        amount: u64,
        ltv_used: u64,
    }

    public struct RepayEvent has copy, drop {
        market_id: ID,
        user: address,
        amount: u64,
        remaining_debt: u64,
    }

    public struct LiquidationEvent has copy, drop {
        market_id: ID,
        liquidator: address,
        position_owner: address,
        debt_repaid: u64,
        collateral_seized: u64,
        bonus_paid: u64,
    }

    // ─── 创建市场 ───

    /// 创建借贷市场（共享对象）。
    public fun create_market(
        symbol: String,
        is_oracle_driven: bool,
        ctx: &mut TxContext,
    ) {
        let market = LendingMarket {
            id: object::new(ctx),
            symbol,
            current_max_ltv: 8000,
            is_oracle_driven,
            pool: balance::zero<SUI>(),
            last_updated: 0,
            total_borrowed: 0,
            liquidation_count: 0,
        };
        transfer::share_object(market);
    }

    // ─── Oracle 同步 ───

    /// 纯函数：风险评分 → 最大 LTV (×10000)。
    public fun compute_max_ltv(risk_score: u64): u64 {
        if (risk_score < 2500) {
            8500
        } else if (risk_score < 5000) {
            7500
        } else if (risk_score < 7500) {
            6000
        } else {
            4000
        }
    }

    /// 读取 Oracle，更新本市场的最大 LTV。
    public fun sync_ltv(
        market: &mut LendingMarket,
        snapshot: &RiskSnapshot,
        clock: &Clock,
    ) {
        assert!(oracle::is_data_fresh(snapshot, clock), E_STALE_ORACLE);
        if (market.is_oracle_driven) {
            let score = oracle::get_risk_score(snapshot);
            market.current_max_ltv = compute_max_ltv(score);
        };
        market.last_updated = clock.timestamp_ms();
    }

    // ─── 用户操作 ───

    /// 创建用户仓位。
    public fun open_position(
        market: &LendingMarket,
        ctx: &mut TxContext,
    ): Position {
        Position {
            id: object::new(ctx),
            market_id: object::id(market),
            collateral: balance::zero<SUI>(),
            debt: 0,
        }
    }

    /// 存入抵押品。
    public fun deposit(
        market: &mut LendingMarket,
        position: &mut Position,
        coin: Coin<SUI>,
        ctx: &mut TxContext,
    ) {
        let amount = coin::value(&coin);
        assert!(amount > 0, E_ZERO_AMOUNT);
        balance::join(&mut position.collateral, coin::into_balance(coin));
        event::emit(DepositEvent {
            market_id: object::id(market),
            user: ctx.sender(),
            amount,
        });
    }

    /// 借出 SUI（从市场池中）。借出额度受动态 LTV 限制。
    public fun borrow(
        market: &mut LendingMarket,
        position: &mut Position,
        amount: u64,
        ctx: &mut TxContext,
    ): Coin<SUI> {
        assert!(amount > 0, E_ZERO_AMOUNT);
        // 计算最大可借额度 = 抵押品 × LTV
        let collateral_value = balance::value(&position.collateral);
        let max_borrow = collateral_value * market.current_max_ltv / 10000;
        let new_debt = position.debt + amount;
        assert!(new_debt <= max_borrow, E_EXCEED_BORROW_LIMIT);
        // 确保池中有足够流动性
        assert!(balance::value(&market.pool) >= amount, E_INSUFFICIENT_COLLATERAL);

        position.debt = new_debt;
        market.total_borrowed = market.total_borrowed + amount;

        event::emit(BorrowEvent {
            market_id: object::id(market),
            user: ctx.sender(),
            amount,
            ltv_used: market.current_max_ltv,
        });

        coin::from_balance(balance::split(&mut market.pool, amount), ctx)
    }

    // ─── 还款与清算 ───

    /// 还款：偿还部分或全部债务。
    public fun repay(
        market: &mut LendingMarket,
        position: &mut Position,
        coin: Coin<SUI>,
        ctx: &mut TxContext,
    ) {
        let amount = coin::value(&coin);
        assert!(amount > 0, E_ZERO_AMOUNT);
        assert!(position.debt > 0, E_NO_DEBT);
        assert!(amount <= position.debt, E_REPAY_TOO_MUCH);

        // 还款归还到市场池
        balance::join(&mut market.pool, coin::into_balance(coin));
        position.debt = position.debt - amount;
        market.total_borrowed = market.total_borrowed - amount;

        event::emit(RepayEvent {
            market_id: object::id(market),
            user: ctx.sender(),
            amount,
            remaining_debt: position.debt,
        });
    }

    /// 判断仓位是否可清算。
    /// 清算条件：debt > collateral × (LTV + threshold_premium) / 10000
    public fun is_liquidatable(
        market: &LendingMarket,
        position: &Position,
    ): bool {
        if (position.debt == 0) return false;
        let collateral_value = balance::value(&position.collateral);
        let liq_threshold = market.current_max_ltv + LIQUIDATION_THRESHOLD_PREMIUM;
        let max_safe_debt = collateral_value * liq_threshold / 10000;
        position.debt > max_safe_debt
    }

    /// 清算：任何人可调用。清算者偿还债务，获得抵押品 + 奖励。
    public fun liquidate(
        market: &mut LendingMarket,
        position: &mut Position,
        repay_coin: Coin<SUI>,
        ctx: &mut TxContext,
    ): Coin<SUI> {
        assert!(is_liquidatable(market, position), E_NOT_LIQUIDATABLE);

        let repay_amount = coin::value(&repay_coin);
        assert!(repay_amount > 0, E_ZERO_AMOUNT);
        // 最多偿还全部债务
        let actual_repay = if (repay_amount > position.debt) {
            position.debt
        } else {
            repay_amount
        };

        // 计算清算者获得的抵押品 = 偿还金额 + 奖励
        let seize_amount = actual_repay + (actual_repay * LIQUIDATION_BONUS / 10000);
        let collateral_available = balance::value(&position.collateral);
        let actual_seize = if (seize_amount > collateral_available) {
            collateral_available
        } else {
            seize_amount
        };

        // 执行清算
        position.debt = position.debt - actual_repay;
        market.total_borrowed = market.total_borrowed - actual_repay;
        market.liquidation_count = market.liquidation_count + 1;

        // 偿还金额归还市场池
        balance::join(&mut market.pool, coin::into_balance(repay_coin));

        // 清算者获得抵押品
        let seized = coin::from_balance(
            balance::split(&mut position.collateral, actual_seize),
            ctx,
        );

        event::emit(LiquidationEvent {
            market_id: object::id(market),
            liquidator: ctx.sender(),
            position_owner: @0x0, // 简化：无法获取 position owner
            debt_repaid: actual_repay,
            collateral_seized: actual_seize,
            bonus_paid: actual_seize - actual_repay,
        });

        seized
    }

    /// 供应方存入流动性到市场池。
    public fun supply(
        market: &mut LendingMarket,
        coin: Coin<SUI>,
    ) {
        balance::join(&mut market.pool, coin::into_balance(coin));
    }

    /// 取回抵押品（需无债务）。
    public fun withdraw_collateral(
        position: &mut Position,
        amount: u64,
        ctx: &mut TxContext,
    ): Coin<SUI> {
        assert!(position.debt == 0, E_NO_DEBT);
        assert!(balance::value(&position.collateral) >= amount, E_INSUFFICIENT_COLLATERAL);
        coin::from_balance(balance::split(&mut position.collateral, amount), ctx)
    }

    // ─── 公开读取接口 ───

    public fun get_max_ltv(market: &LendingMarket): u64 { market.current_max_ltv }
    public fun is_oracle_driven(market: &LendingMarket): bool { market.is_oracle_driven }
    public fun get_total_borrowed(market: &LendingMarket): u64 { market.total_borrowed }
    public fun get_liquidation_count(market: &LendingMarket): u64 { market.liquidation_count }
    public fun get_pool_balance(market: &LendingMarket): u64 { balance::value(&market.pool) }
    public fun get_collateral(position: &Position): u64 { balance::value(&position.collateral) }
    public fun get_debt(position: &Position): u64 { position.debt }
}
