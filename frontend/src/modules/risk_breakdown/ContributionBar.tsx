import { RiskContribution } from "../../api/client";
import { riskBgClass, scoreToLevel } from "../../lib/format";
import { DriverTags } from "./DriverTags";

interface ContributionBarProps {
  item: RiskContribution;
}

export function ContributionBar({ item }: ContributionBarProps) {
  const pct = Math.min(item.contribution * 100, 100);
  const level = scoreToLevel(item.score);

  return (
    <div className="glass-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-text-primary">{item.source}</span>
        <span className="text-xs text-text-secondary">权重 {(item.weight * 100).toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${riskBgClass(level)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-text-secondary">
        分数: {item.score.toFixed(1)} → 贡献: {item.contribution.toFixed(1)}
      </div>
      <DriverTags drivers={item.drivers} />
    </div>
  );
}
