import { BacktestPoint } from "../../api/client";

interface EventTimelineProps {
  series: BacktestPoint[];
}

export function EventTimeline({ series }: EventTimelineProps) {
  const events = series.filter((p) => p.event);

  return (
    <div className="glass-card p-5 mt-6">
      <h4 className="text-sm text-text-secondary font-semibold mb-4">关键事件时间轴</h4>
      <div className="relative pl-4 border-l-2 border-border">
        {events.map((point) => (
          <div key={point.date} className="relative pl-4 pb-4">
            <div className={`absolute -left-[1.35rem] top-2 w-2.5 h-2.5 rounded-full ${
              point.action === "exit" ? "bg-risk-critical" :
              point.action === "reduce" ? "bg-severity-warning" : "bg-text-secondary"
            }`} />
            <div className="text-[0.7rem] text-text-secondary">{point.date}</div>
            <div className="text-sm my-0.5">{point.event}</div>
            <div className="flex gap-3 text-[0.7rem] text-text-secondary">
              <span>风险: {point.risk_score}</span>
              <span>仓位: {point.exposure}%</span>
              <span className={`font-semibold ${
                point.action === "exit" ? "text-risk-critical" :
                point.action === "reduce" ? "text-severity-warning" : ""
              }`}>
                {point.action === "exit" ? "全退出" :
                 point.action === "reduce" ? "减仓" : "持有"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
