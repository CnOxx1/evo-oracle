import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { AlertItem } from "./AlertItem";

export function AlertFeed() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["alerts-all"],
    queryFn: api.alerts,
  });

  if (isLoading) return <div className="text-text-secondary animate-pulse p-8 text-center">加载告警流...</div>;
  if (error) return <div className="text-risk-high p-8 text-center">告警服务不可用</div>;

  const alerts = data?.alerts ?? [];

  return (
    <section className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text">告警流</h2>
        <p className="text-text-secondary mt-1">共 {data?.alert_count ?? 0} 条活跃告警</p>
      </div>
      {alerts.length === 0 ? (
        <div className="glass-card p-12 text-center text-text-secondary text-lg">当前无活跃告警 ✓</div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <AlertItem key={`${alert.type}-${alert.symbol}-${i}`} alert={alert} />
          ))}
        </div>
      )}
    </section>
  );
}
