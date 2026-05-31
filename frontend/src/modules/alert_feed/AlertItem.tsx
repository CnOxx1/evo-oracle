import { Alert } from "../../api/client";
import { SeverityBadge } from "./SeverityBadge";

interface AlertItemProps {
  alert: Alert;
}

export function AlertItem({ alert }: AlertItemProps) {
  return (
    <div className={`alert-item alert-item--${alert.severity}`}>
      <div className="alert-item__header">
        <SeverityBadge severity={alert.severity} />
        {alert.symbol && <span className="alert-item__symbol">{alert.symbol}</span>}
        <span className="alert-item__type">{alert.type}</span>
      </div>
      <p className="alert-item__message">{alert.message}</p>
    </div>
  );
}
