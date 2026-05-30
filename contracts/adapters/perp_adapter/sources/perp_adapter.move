/// 永续合约协议适配器示例。
///
/// 演示永续 DEX 如何用 EvoOracle 把固定最大杠杆变成动态最大杠杆。
/// 这是适配器演示，非完整永续协议（不含开仓/资金费率/清算）。
module evo_oracle::perp_adapter {
    use std::string::String;
    use sui::clock::Clock;
    use evo_oracle::oracle::{Self, RiskSnapshot};

    /// Oracle 数据过期，拒绝同步。
    const E_STALE_ORACLE: u64 = 1;

    /// 永续市场（共享对象，演示用）
    public struct PerpMarket has key {
        id: UID,
        symbol: String,
        current_max_leverage: u64,
        is_oracle_driven: bool,
        last_updated: u64,
    }

    /// 创建永续市场。
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
            last_updated: 0,
        };
        transfer::share_object(market);
    }

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
        // 资金费率异常时再降一档（最低 1x）
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

    public fun get_max_leverage(market: &PerpMarket): u64 { market.current_max_leverage }

    public fun is_oracle_driven(market: &PerpMarket): bool { market.is_oracle_driven }
}
