interface WhaleBiasBannerProps {
  bias: string;
  implication: string;
  accumulating: number;
  distributing: number;
}

const biasConfig: Record<string, { color: string; icon: string }> = {
  distribution: { color: "var(--color-risk-high)", icon: "↓" },
  accumulation: { color: "var(--color-risk-low)", icon: "↑" },
  mixed: { color: "var(--color-risk-medium)", icon: "↔" },
};

export function WhaleBiasBanner({ bias, implication, accumulating, distributing }: WhaleBiasBannerProps) {
  const cfg = biasConfig[bias] || biasConfig.mixed;

  return (
    <div className="glass-card p-4 mb-6 border-l-4" style={{ borderLeftColor: cfg.color }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl" style={{ color: cfg.color }}>{cfg.icon}</span>
        <span className="text-base font-bold" style={{ color: cfg.color }}>
          {bias.toUpperCase()}
        </span>
      </div>
      <p className="text-sm text-text-secondary mb-2">{implication}</p>
      <div className="flex gap-6 text-sm font-semibold">
        <span className="text-risk-low">积累: {accumulating}</span>
        <span className="text-risk-high">派发: {distributing}</span>
      </div>
    </div>
  );
}
