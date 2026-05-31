"""Vault 收益归因 — 拆解超额收益来源。"""

from __future__ import annotations
from typing import Any


def compute_vault_attribution(risk_score: float) -> dict[str, Any]:
    """计算 vault 收益归因。"""
    # 模拟 30 天收益数据
    # Protected vault 通过动态调仓获得超额收益
    base_return = -2.5  # 市场基准收益（负 = 下跌市）
    rebalance_alpha = max(0, (risk_score - 40) * 0.08)  # 风险越高，调仓贡献越大
    timing_alpha = 1.2  # 择时贡献
    fee_drag = -0.3  # 手续费拖累

    protected_return = base_return + rebalance_alpha + timing_alpha + fee_drag
    static_return = base_return - 1.5  # 静态策略额外亏损

    # 归因明细
    attribution = [
        {"factor": "市场基准", "contribution_pct": round(base_return, 2), "description": "持有期间市场整体表现"},
        {"factor": "动态调仓", "contribution_pct": round(rebalance_alpha, 2), "description": "基于风险分的仓位调整收益"},
        {"factor": "择时贡献", "contribution_pct": round(timing_alpha, 2), "description": "在高风险时提前减仓的收益"},
        {"factor": "交易成本", "contribution_pct": round(fee_drag, 2), "description": "调仓产生的手续费"},
    ]

    # 模拟调仓历史
    rebalance_events = [
        {"day": 3, "action": "减仓 SUI 20%", "risk_score_at_time": 62, "saved_loss_pct": 1.8},
        {"day": 8, "action": "增加 USDC 15%", "risk_score_at_time": 71, "saved_loss_pct": 2.3},
        {"day": 15, "action": "恢复 SUI 10%", "risk_score_at_time": 45, "saved_loss_pct": 0},
        {"day": 22, "action": "减仓 ETH 10%", "risk_score_at_time": 58, "saved_loss_pct": 0.9},
    ]

    return {
        "period_days": 30,
        "protected_return_pct": round(protected_return, 2),
        "static_return_pct": round(static_return, 2),
        "outperformance_pct": round(protected_return - static_return, 2),
        "attribution": attribution,
        "rebalance_events": rebalance_events,
        "total_rebalances": len(rebalance_events),
        "total_saved_loss_pct": round(sum(e["saved_loss_pct"] for e in rebalance_events), 2),
        "current_risk_score": risk_score,
    }
