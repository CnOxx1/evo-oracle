interface SeverityBadgeProps {
  severity: "info" | "warning" | "critical";
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const colorVar = `var(--color-severity-${severity})`;
  return (
    <span
      className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-full text-white"
      style={{ background: colorVar }}
    >
      {severity.toUpperCase()}
    </span>
  );
}
