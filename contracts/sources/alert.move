/// 链上异常告警。
///
/// 把后端 alert_engine 检测到的异常作为 Sui event 发出，协议/前端可订阅。
module evo_oracle::alert {
    use std::string::String;
    use sui::clock::Clock;
    use sui::event;
    use evo_oracle::oracle::OracleAdminCap;

    /// 风险告警 event。
    public struct RiskAlert has copy, drop {
        symbol: String,
        alert_type: u8,   // 0=funding 1=volatility 2=risk_escalation 3=macro_flip 4=trend 5=sentiment
        severity: u8,     // 0=info 1=warning 2=critical
        value: u64,       // 触发值（定点编码）
        timestamp: u64,
    }

    /// 发出一条告警 event（仅 AdminCap）。
    public fun emit_alert(
        _cap: &OracleAdminCap,
        symbol: String,
        alert_type: u8,
        severity: u8,
        value: u64,
        clock: &Clock,
    ) {
        event::emit(RiskAlert {
            symbol,
            alert_type,
            severity,
            value,
            timestamp: clock.timestamp_ms(),
        });
    }
}
