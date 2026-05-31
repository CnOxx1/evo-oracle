interface WhaleBiasBannerProps {
  bias: string;
  implication: string;
  accumulating: number;
  distributing: number;
}

const biasConfig: Record<string, { color: string; icon: string }> = {
  distribution: { color: "var(--risk-high)", icon: "↓" },
  accumulation: { color: "var(--risk-low)", icon: "↑" },
  mixed: { color: "var(--risk-medium)", icon: "↔" },
};

export function WhaleBiasBanner({ bias, implication, accumulating, distributing }: WhaleBiasBannerProps) {
  const cfg = biasConfig[bias] || biasConfig.mixed;

  return (
    <div className="whale-bias-banner" style={{ borderLeftColor: cfg.color }}>
      <div className="whale-bias-banner__header">
        <span className="whale-bias-banner__icon" style={{ color: cfg.color }}>{cfg.icon}</span>
        <span className="whale-bias-banner__label" style={{ color: cfg.color }}>
          {bias.toUpperCase()}
        </span>
      </div>
      <p className="whale-bias-banner__desc">{implication}</p>
      <div className="whale-bias-banner__counts">
        <span style={{ color: "var(--risk-low)" }}>积累: {accumulating}</span>
        <span style={{ color: "var(--risk-high)" }}>派发: {distributing}</span>
      </div>
    </div>
  );
}
