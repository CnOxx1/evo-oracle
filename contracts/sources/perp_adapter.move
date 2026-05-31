/// 永续合约协议适配器（可操作版本）。
///
/// 用户可开多/空仓，杠杆倍数由 EvoOracle 动态限制。
/// 保证金不足时任何人可触发强制平仓（获得清算奖励）。
/// 核心演示：Oracle 风险评分升高 → 最大杠杆自动降低 → 新仓位受限 → 减少爆仓。
module evo_oracle::perp_adapter {
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
    const E_EXCEED_LEVERAGE: u64 = 3;
    const E_INSUFFICIENT_MARGIN: u64 = 4;
    const E_NOT_LIQUIDATABLE: u64 = 5;
    const E_POSITION_OPEN: u64 = 6;
    const E_NO_POSITION: u64 = 7;

    /// 维持保证金率 (×10000)，5% = 500
    const MAINTENANCE_MARGIN_RATE: u64 = 500;
    /// 清算奖励 (×10000)，2.5% = 250
    const LIQUIDATION_BONUS: u64 = 250;

    // ─── 数据结构 ───

    /// 永续市场（共享对象）
    public struct PerpMarket has key {
        id: UID,
        symbol: String,
        /// 当前最大杠杆 (e.g. 20 = 20x)
        current_max_leverage: u64,
        /// 是否由 Oracle 驱动
        is_oracle_driven: bool,
        /// 保险基金（清算剩余归入）
        insurance_fund: Balance<SUI>,
        /// 上次 Oracle 同步时间
        last_updated: u64,
        /// 总开仓量
        total_open_interest: u64,
        /// 强平次数
        liquidation_count: u64,
    }

    /// 用户永续仓位
    /// direction: 0=long, 1=short
    public struct PerpPosition has key, store {
        id: UID,
        market_id: ID,
        /// 保证金
        margin: Balance<SUI>,
        /// 仓位名义价值（以 SUI 计价）
        size: u64,
        /// 开仓时使用的杠杆
        leverage: u64,
        /// 方向：0=多, 1=空
        direction: u8,
        /// 开仓价格标记（简化：用时间戳代替）
        entry_timestamp: u64,
    }

    // ─── Events ───

    public struct OpenPositionEvent has copy, drop {
        market_id: ID,
        trader: address,
        direction: u8,
        margin: u64,
        size: u64,
        leverage: u64,
    }

    public struct ClosePositionEvent has copy, drop {
        market_id: ID,
        trader: address,
        margin_returned: u64,
    }

    public struct ForceLiquidationEvent has copy, drop {
        market_id: ID,
        liquidator: address,
        position_size: u64,
        margin_seized: u64,
        bonus_paid: u64,
    }

    // ─── 创建市场 ───

    /// 创建永续市场（共享对象）。
    public fun create_market(
        symbol: String,
        is_oracle_driven: bool,
        ctx: &mut TxContext,
    ) {
        let market = PerpMarket {
            id: object::new(ctx),
            symbol,
            current_max_leverage: 20,
            is_oracle_driven,
            insurance_fund: balance::zero<SUI>(),
            last_updated: 0,
            total_open_interest: 0,
            liquidation_count: 0,
        };
        transfer::share_object(market);
    }

    // ─── Oracle 同步 ───

    /// 纯函数：风险评分(+资金费率异常) → 最大杠杆。
    public fun compute_max_leverage(risk_score: u64, funding_anomaly: bool): u64 {
        let base = if (risk_score < 2500) {
            20
        } else if (risk_score < 5000) {
            10
        } else if (risk_score < 7500) {
            5
        } else {
            2
        };
        if (funding_anomaly && base > 1) {
            base / 2
        } else {
            base
        }
    }

    /// 读取 Oracle，更新本市场最大杠杆。
    public fun sync_leverage(
        market: &mut PerpMarket,
        snapshot: &RiskSnapshot,
        clock: &Clock,
    ) {
        assert!(oracle::is_data_fresh(snapshot, clock), E_STALE_ORACLE);
        if (market.is_oracle_driven) {
            let score = oracle::get_risk_score(snapshot);
            let anomaly = oracle::is_funding_anomaly(snapshot);
            market.current_max_leverage = compute_max_leverage(score, anomaly);
        };
        market.last_updated = clock.timestamp_ms();
    }

    // ─── 用户操作 ───

    /// 开仓：存入保证金，按杠杆开多/空仓。
    /// direction: 0=多(long), 1=空(short)
    public fun open_position(
        market: &mut PerpMarket,
        margin_coin: Coin<SUI>,
        leverage: u64,
        direction: u8,
        clock: &Clock,
        ctx: &mut TxContext,
    ): PerpPosition {
        let margin_amount = coin::value(&margin_coin);
        assert!(margin_amount > 0, E_ZERO_AMOUNT);
        assert!(leverage >= 1 && leverage <= market.current_max_leverage, E_EXCEED_LEVERAGE);

        let size = margin_amount * leverage;
        market.total_open_interest = market.total_open_interest + size;

        event::emit(OpenPositionEvent {
            market_id: object::id(market),
            trader: ctx.sender(),
            direction,
            margin: margin_amount,
            size,
            leverage,
        });

        PerpPosition {
            id: object::new(ctx),
            market_id: object::id(market),
            margin: coin::into_balance(margin_coin),
            size,
            leverage,
            direction,
            entry_timestamp: clock.timestamp_ms(),
        }
    }

    /// 平仓：关闭仓位，返还保证金。
    public fun close_position(
        market: &mut PerpMarket,
        position: PerpPosition,
        ctx: &mut TxContext,
    ): Coin<SUI> {
        let PerpPosition { id, market_id: _, margin, size, leverage: _, direction: _, entry_timestamp: _ } = position;
        object::delete(id);

        market.total_open_interest = market.total_open_interest - size;
        let margin_amount = balance::value(&margin);

        event::emit(ClosePositionEvent {
            market_id: object::id(market),
            trader: ctx.sender(),
            margin_returned: margin_amount,
        });

        coin::from_balance(margin, ctx)
    }

    // ─── 强制平仓 ───

    /// 判断仓位是否可被强制平仓。
    /// 条件：保证金 < 仓位名义价值 × 维持保证金率
    /// 简化模型：用时间衰减模拟浮亏（每小时损失 margin 的 2%）
    public fun is_liquidatable(
        position: &PerpPosition,
        clock: &Clock,
    ): bool {
        let margin_value = balance::value(&position.margin);
        if (margin_value == 0) return false;
        let required_margin = position.size * MAINTENANCE_MARGIN_RATE / 10000;
        // 模拟浮亏：时间越长，保证金越少（演示用）
        let elapsed_ms = clock.timestamp_ms() - position.entry_timestamp;
        let hours_elapsed = elapsed_ms / 3_600_000;
        // 每小时损失 2% 的保证金（模拟不利行情）
        let simulated_loss = margin_value * hours_elapsed * 200 / 10000;
        let effective_margin = if (simulated_loss >= margin_value) {
            0
        } else {
            margin_value - simulated_loss
        };
        effective_margin < required_margin
    }

    /// 强制平仓：任何人可调用。清算者获得保证金中的奖励部分。
    public fun force_liquidate(
        market: &mut PerpMarket,
        position: PerpPosition,
        clock: &Clock,
        ctx: &mut TxContext,
    ): Coin<SUI> {
        assert!(is_liquidatable(&position, clock), E_NOT_LIQUIDATABLE);

        let PerpPosition { id, market_id: _, margin, size, leverage: _, direction: _, entry_timestamp: _ } = position;
        object::delete(id);

        let margin_value = balance::value(&margin);
        market.total_open_interest = market.total_open_interest - size;
        market.liquidation_count = market.liquidation_count + 1;

        // 清算者获得奖励（保证金的 2.5%）
        let bonus = margin_value * LIQUIDATION_BONUS / 10000;
        let liquidator_reward = coin::from_balance(
            balance::split(&mut margin, bonus),
            ctx,
        );
        // 剩余保证金归入保险基金
        balance::join(&mut market.insurance_fund, margin);

        event::emit(ForceLiquidationEvent {
            market_id: object::id(market),
            liquidator: ctx.sender(),
            position_size: size,
            margin_seized: margin_value,
            bonus_paid: bonus,
        });

        liquidator_reward
    }

    /// 追加保证金（防止被清算）。
    public fun add_margin(
        position: &mut PerpPosition,
        coin: Coin<SUI>,
    ) {
        assert!(coin::value(&coin) > 0, E_ZERO_AMOUNT);
        balance::join(&mut position.margin, coin::into_balance(coin));
    }

    // ─── 公开读取接口 ───

    public fun get_max_leverage(market: &PerpMarket): u64 { market.current_max_leverage }
    public fun is_oracle_driven(market: &PerpMarket): bool { market.is_oracle_driven }
    public fun get_total_open_interest(market: &PerpMarket): u64 { market.total_open_interest }
    public fun get_liquidation_count(market: &PerpMarket): u64 { market.liquidation_count }
    public fun get_insurance_fund(market: &PerpMarket): u64 { balance::value(&market.insurance_fund) }
    public fun get_margin(position: &PerpPosition): u64 { balance::value(&position.margin) }
    public fun get_size(position: &PerpPosition): u64 { position.size }
    public fun get_leverage(position: &PerpPosition): u64 { position.leverage }
    public fun get_direction(position: &PerpPosition): u8 { position.direction }
}
