interface WhaleBiasBannerProps {
  bias: string;
  implication: string;
  accumulating: number;
  distributing: number;
}

const biasConfig: Record<string, { borderCls: string; textCls: string; icon: string }> = {
  distribution: { borderCls: "border-l-risk-high", textCls: "text-risk-high", icon: "↓" },
  accumulation: { borderCls: "border-l-risk-low", textCls: "text-risk-low", icon: "↑" },
  mixed: { borderCls: "border-l-risk-medium", textCls: "text-risk-medium", icon: "↔" },
};

export function WhaleBiasBanner({ bias, implication, accumulating, distributing }: WhaleBiasBannerProps) {
  const cfg = biasConfig[bias] || biasConfig.mixed;

  return (
    <div className={`glass-card p-4 mb-6 border-l-4 ${cfg.borderCls}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-2xl ${cfg.textCls}`}>{cfg.icon}</span>
        <span className={`text-base font-bold ${cfg.textCls}`}>
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
