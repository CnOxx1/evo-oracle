"""宏观市场状态详情。"""

from __future__ import annotations
import time
from typing import Any


def compute_macro_detail(macro_data: dict[str, Any], portfolio_data: dict[str, Any]) -> dict[str, Any]:
    """计算宏观状态详情 + 历史上下文。"""
    stance = macro_data.get("overall_stance", "neutral")
    indicators = macro_data.get("indicators", {})

    # 模拟历史 regime 切换
    regime_history = [
        {"stance": "risk_on", "start_ts": time.time() - 86400 * 30, "duration_days": 15},
        {"stance": "neutral", "start_ts": time.time() - 86400 * 15, "duration_days": 8},
        {"stance": "risk_off", "start_ts": time.time() - 86400 * 7, "duration_days": 5},
        {"stance": stance, "start_ts": time.time() - 86400 * 2, "duration_days": 2},
    ]

    # 各 regime 下的典型资产表现
    regime_behaviors = {
        "risk_on": {"typical_btc": "+5~15%", "typical_alts": "+10~30%", "typical_stables": "flat", "description": "市场乐观，资金流入风险资产"},
        "risk_off": {"typical_btc": "-5~15%", "typical_alts": "-15~40%", "typical_stables": "premium", "description": "避险情绪主导，资金流出风险资产"},
        "neutral": {"typical_btc": "±3%", "typical_alts": "±5%", "typical_stables": "flat", "description": "市场观望，波动率收缩"},
    }

    current_behavior = regime_behaviors.get(stance, regime_behaviors["neutral"])
    var_95 = portfolio_data.get("var_95", 0.03)

    return {
        "current_stance": stance,
        "stance_duration_days": regime_history[-1]["duration_days"],
        "indicators": indicators,
        "regime_history": regime_history,
        "current_behavior": current_behavior,
        "portfolio_var_95": round(abs(var_95) * 100, 2),
        "recommendation": (
            "降低杠杆，增加稳定币配置" if stance == "risk_off" else
            "可适度增加风险敞口" if stance == "risk_on" else
            "维持当前配置，关注信号变化"
        ),
    }
