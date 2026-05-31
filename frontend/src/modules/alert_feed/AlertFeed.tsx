import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { AlertItem } from "./AlertItem";

export function AlertFeed() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["alerts-all"],
    queryFn: api.alerts,
  });

  if (isLoading) return <div className="loading">加载告警流...</div>;
  if (error) return <div className="error">告警服务不可用</div>;

  const alerts = data?.alerts ?? [];

  return (
    <section className="alert-feed">
      <h2>告警流</h2>
      <p className="subtitle">共 {data?.alert_count ?? 0} 条活跃告警</p>
      {alerts.length === 0 ? (
        <div className="placeholder">当前无活跃告警 ✓</div>
      ) : (
        <div className="alert-list">
          {alerts.map((alert, i) => (
            <AlertItem key={`${alert.type}-${alert.symbol}-${i}`} alert={alert} />
          ))}
        </div>
      )}
    </section>
  );
}
