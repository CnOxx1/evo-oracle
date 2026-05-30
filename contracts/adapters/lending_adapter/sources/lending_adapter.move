/// 借贷协议适配器示例。
///
/// 演示借贷协议如何用 EvoOracle 把固定 LTV 变成动态 LTV。
/// 这是适配器演示，非完整借贷协议（不含实际抵押/借出/清算）。
module evo_oracle::lending_adapter {
    use std::string::String;
    use sui::clock::Clock;
    use evo_oracle::oracle::{Self, RiskSnapshot};

    /// Oracle 数据过期，拒绝同步。
    const E_STALE_ORACLE: u64 = 1;

    /// 借贷市场（共享对象，演示用）
    public struct LendingMarket has key {
        id: UID,
        symbol: String,
        current_max_ltv: u64,    // ×100
        is_oracle_driven: bool,
        last_updated: u64,
    }

    /// 创建借贷市场。
    public fun create_market(
        symbol: String,
        is_oracle_driven: bool,
        ctx: &mut TxContext,
    ) {
        let market = LendingMarket {
            id: object::new(ctx),
            symbol,
            current_max_ltv: 8000,   // 默认 80%
            is_oracle_driven,
            last_updated: 0,
        };
        transfer::share_object(market);
    }

    /// 纯函数：风险评分 → 最大 LTV（×100）。
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

    public fun get_max_ltv(market: &LendingMarket): u64 { market.current_max_ltv }

    public fun is_oracle_driven(market: &LendingMarket): bool { market.is_oracle_driven }
}
