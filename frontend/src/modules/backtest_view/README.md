# backtest_view 模块

历史回测可视化。复盘 2022 年 LUNA 崩盘期间，EvoOracle 信号如何提前降低仓位，用真实历史数据证明保护效果。

## 展示内容

- 时间轴（2022-05-07 → 2022-05-13）
- 多轨叠加图：
  - 风险评分随时间上升
  - Protected Vault 的 SUI 仓位随评分下降
  - 价格暴跌曲线
- 结论卡片：Protected 总损失 vs Static 总损失

## 数据来源

- `api.getLunaBacktest()` → 后端 `GET /api/backtest/luna`
- 后端基于 EvoQuantV3 `GET /time-slice/range` 的历史 K 线 + 技术指标回算

## 为什么重要

把「我会保护你」变成「历史数据证明我保护过」。这是降维打击——多数参赛者用 Mock 数据，本模块用真实历史回测。

## 组件计划

| 组件 | 说明 |
| --- | --- |
| `BacktestView.tsx` | 模块容器 |
| `LunaTimelineChart.tsx` | 多轨时间轴叠加图 |
| `ResultSummary.tsx` | 损失对比结论卡片 |

## 开发日志

| 日期 | 改动 |
| --- | --- |
| 2026-05-30 | 定义模块职责、数据来源与组件清单（待实现） |
