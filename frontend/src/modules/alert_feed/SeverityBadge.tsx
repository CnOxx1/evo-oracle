interface SeverityBadgeProps {
  severity: "info" | "warning" | "critical";
}

const severityBgClass: Record<string, string> = {
  info: "bg-severity-info",
  warning: "bg-severity-warning",
  critical: "bg-severity-critical",
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span
      className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded-full text-white ${severityBgClass[severity]}`}
    >
      {severity.toUpperCase()}
    </span>
  );
}
