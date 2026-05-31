import { BacktestPoint } from "../../api/client";

interface EventTimelineProps {
  series: BacktestPoint[];
}

export function EventTimeline({ series }: EventTimelineProps) {
  const events = series.filter((p) => p.event);

  return (
    <div className="event-timeline">
      <h4>关键事件时间轴</h4>
      <div className="event-timeline__list">
        {events.map((point) => (
          <div key={point.date} className={`event-timeline__item event-timeline__item--${point.action}`}>
            <div className="event-timeline__date">{point.date}</div>
            <div className="event-timeline__dot" />
            <div className="event-timeline__content">
              <div className="event-timeline__event">{point.event}</div>
              <div className="event-timeline__meta">
                <span>风险: {point.risk_score}</span>
                <span>仓位: {point.exposure}%</span>
                <span className={`event-timeline__action event-timeline__action--${point.action}`}>
                  {point.action === "exit" ? "全退出" :
                   point.action === "reduce" ? "减仓" : "持有"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
