interface SeverityBadgeProps {
  severity: "info" | "warning" | "critical";
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const colorVar = `var(--severity-${severity})`;
  return (
    <span className="severity-badge" style={{ background: colorVar }}>
      {severity.toUpperCase()}
    </span>
  );
}
