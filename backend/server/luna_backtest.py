"""LUNA 崩盘交互式回测引擎。

2022-05-07 ~ 2022-05-13 期间 LUNA/UST 崩盘历史数据，
支持参数化模拟：用户可调风险阈值、初始仓位，实时对比保护效果。

数据来源：CoinGecko 历史价格 + 模拟风险评分。
"""

from __future__ import annotations

# ─── 原始市场数据（价格 + 风险评分，不随参数变化） ───
LUNA_RAW_DATA: list[dict] = [
    {"date": "2022-05-07", "price": 77.5, "risk_score": 42,
     "event": None},
    {"date": "2022-05-08", "price": 68.2, "risk_score": 58,
     "event": "UST 轻微脱锚 ($0.985)"},
    {"date": "2022-05-09", "price": 61.0, "risk_score": 72,
     "event": "UST 跌至 $0.90，LFG 开始抛售 BTC 储备"},
    {"date": "2022-05-10", "price": 30.5, "risk_score": 89,
     "event": "LUNA 单日暴跌 50%，死亡螺旋启动"},
    {"date": "2022-05-11", "price": 16.8, "risk_score": 95,
     "event": "链上铸造失控，LUNA 供应量爆炸"},
    {"date": "2022-05-12", "price": 2.1, "risk_score": 99,
     "event": "Terra 链暂停出块"},
    {"date": "2022-05-13", "price": 0.8, "risk_score": 99,
     "event": "LUNA 归零，$400亿市值蒸发"},
]

LUNA_BACKTEST_WINDOW = {"start": "2022-05-07", "end": "2022-05-13"}


def simulate_backtest(
    exit_threshold: int = 70,
    reduce_threshold: int = 50,
    initial_exposure: int = 100,
) -> dict:
    """参数化回测模拟。

    Args:
        exit_threshold: 风险评分超过此值时全部退出 (0-100)
        reduce_threshold: 风险评分超过此值时减仓 (0-100)
        initial_exposure: 初始仓位百分比 (0-100)

    Returns:
        包含 series、summary、parameters 的完整回测结果
    """
    series = []
    actions_taken = 0

    # Protected 策略：逐日追踪 portfolio value
    exposure_pct = initial_exposure / 100.0  # 当前敞口比例 (0~1)
    protected_value = 100.0  # 初始 $100
    prev_price = LUNA_RAW_DATA[0]["price"]

    for i, point in enumerate(LUNA_RAW_DATA):
        price = point["price"]

        # 计算当日价格变动
        if i == 0:
            daily_return = 0.0
        else:
            daily_return = (price - prev_price) / prev_price

        # Static 策略：始终满仓，直接按价格比例
        start_price = LUNA_RAW_DATA[0]["price"]
        static_pnl = ((price / start_price) - 1) * 100

        # Protected 策略：先根据风险调仓，再计算当日收益
        risk = point["risk_score"]
        action = "hold"

        if risk >= exit_threshold:
            if exposure_pct > 0.05:
                actions_taken += 1
                action = "exit"
            exposure_pct = 0.05  # 保留 5% 最小仓位
        elif risk >= reduce_threshold:
            target = max(0.2, (initial_exposure / 100.0) - (risk - reduce_threshold) * 0.02)
            if target < exposure_pct:
                actions_taken += 1
                action = "reduce"
            exposure_pct = target

        # 当日 PnL = 仓位 × 日收益率
        protected_value *= (1 + daily_return * exposure_pct)
        protected_pnl = protected_value - 100.0

        series.append({
            "date": point["date"],
            "price": point["price"],
            "risk_score": point["risk_score"],
            "event": point["event"],
            "protected_pnl": round(protected_pnl, 1),
            "static_pnl": round(static_pnl, 1),
            "exposure": round(exposure_pct * 100),
            "action": action,
        })

        prev_price = price

    # 计算摘要指标
    final_protected = series[-1]["protected_pnl"]
    final_static = series[-1]["static_pnl"]
    max_dd_static = min(p["static_pnl"] for p in series)
    max_dd_protected = min(p["protected_pnl"] for p in series)

    return {
        "window": LUNA_BACKTEST_WINDOW,
        "parameters": {
            "exit_threshold": exit_threshold,
            "reduce_threshold": reduce_threshold,
            "initial_exposure": initial_exposure,
        },
        "series": series,
        "summary": {
            "protected_final": round(final_protected, 1),
            "static_final": round(final_static, 1),
            "max_drawdown_avoided": round(abs(max_dd_static) - abs(max_dd_protected), 1),
            "actions_taken": actions_taken,
            "max_drawdown_protected": round(max_dd_protected, 1),
            "max_drawdown_static": round(max_dd_static, 1),
        },
    }


# 兼容旧接口
_default = simulate_backtest()
LUNA_BACKTEST_SERIES = _default["series"]
LUNA_BACKTEST_SUMMARY = _default["summary"]
