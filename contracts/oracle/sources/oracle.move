/// EvoOracle 链上风险预言机。
///
/// 存储各资产的风险评分与 AI 信号，由授权 Bridge 更新，任何协议公开读取。
module evo_oracle::oracle {
    use std::string::String;
    use sui::clock::Clock;

    /// 数据过期阈值：1 小时（毫秒）
    const FRESHNESS_WINDOW_MS: u64 = 3_600_000;

    /// 风险快照（共享对象）
    public struct RiskSnapshot has key {
        id: UID,
        symbol: String,
        risk_score: u64,        // 0–10000
        risk_level: u8,         // 0=low 1=medium 2=high 3=extreme
        trend: u8,              // 0=bearish 1=neutral 2=bullish
        funding_anomaly: bool,
        macro_stance: u8,       // 0=risk_off 1=neutral 2=risk_on
        annualized_vol: u64,    // 实际值 ×10000
        updated_at: u64,        // timestamp ms
    }

    /// 更新授权能力。只有持有者（Bridge）能更新快照。
    public struct OracleAdminCap has key, store {
        id: UID,
    }

    /// 部署时初始化：把 AdminCap 发给部署者。
    fun init(ctx: &mut TxContext) {
        transfer::transfer(
            OracleAdminCap { id: object::new(ctx) },
            ctx.sender(),
        );
    }

    /// 为某资产创建共享的 RiskSnapshot。
    public fun create_snapshot(
        _cap: &OracleAdminCap,
        symbol: String,
        ctx: &mut TxContext,
    ) {
        let snapshot = RiskSnapshot {
            id: object::new(ctx),
            symbol,
            risk_score: 0,
            risk_level: 1,
            trend: 1,
            funding_anomaly: false,
            macro_stance: 1,
            annualized_vol: 0,
            updated_at: 0,
        };
        transfer::share_object(snapshot);
    }

    /// 更新风险快照（仅 AdminCap）。
    public fun update_risk(
        _cap: &OracleAdminCap,
        snapshot: &mut RiskSnapshot,
        risk_score: u64,
        risk_level: u8,
        trend: u8,
        funding_anomaly: bool,
        macro_stance: u8,
        annualized_vol: u64,
        clock: &Clock,
    ) {
        snapshot.risk_score = risk_score;
        snapshot.risk_level = risk_level;
        snapshot.trend = trend;
        snapshot.funding_anomaly = funding_anomaly;
        snapshot.macro_stance = macro_stance;
        snapshot.annualized_vol = annualized_vol;
        snapshot.updated_at = clock.timestamp_ms();
    }

    // ---- 公开读取接口 ----

    public fun get_risk_score(snapshot: &RiskSnapshot): u64 { snapshot.risk_score }

    public fun get_risk_level(snapshot: &RiskSnapshot): u8 { snapshot.risk_level }

    public fun get_trend(snapshot: &RiskSnapshot): u8 { snapshot.trend }

    public fun get_macro_stance(snapshot: &RiskSnapshot): u8 { snapshot.macro_stance }

    public fun get_annualized_vol(snapshot: &RiskSnapshot): u64 { snapshot.annualized_vol }

    public fun is_funding_anomaly(snapshot: &RiskSnapshot): bool { snapshot.funding_anomaly }

    /// 数据是否新鲜（距上次更新 < 1 小时）。
    public fun is_data_fresh(snapshot: &RiskSnapshot, clock: &Clock): bool {
        clock.timestamp_ms() - snapshot.updated_at < FRESHNESS_WINDOW_MS
    }
}
