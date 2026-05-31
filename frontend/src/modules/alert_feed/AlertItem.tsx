import { Alert } from "../../api/client";
import { SeverityBadge } from "./SeverityBadge";

interface AlertItemProps {
  alert: Alert;
}

const borderColor: Record<string, string> = {
  info: "border-severity-info/40",
  warning: "border-severity-warning/40",
  critical: "border-severity-critical/40",
};

export function AlertItem({ alert }: AlertItemProps) {
  return (
    <div className={`glass-card p-4 border-l-4 ${borderColor[alert.severity] ?? "border-accent/20"}`}>
      <div className="flex items-center gap-2 mb-2">
        <SeverityBadge severity={alert.severity} />
        {alert.symbol && (
          <span className="text-sm font-semibold text-accent">{alert.symbol}</span>
        )}
        <span className="text-xs text-text-secondary ml-auto">{alert.type}</span>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{alert.message}</p>
    </div>
  );
}
