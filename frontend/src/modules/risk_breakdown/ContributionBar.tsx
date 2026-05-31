import { RiskContribution } from "../../api/client";
import { riskColor, scoreToLevel } from "../../lib/format";
import { DriverTags } from "./DriverTags";

interface ContributionBarProps {
  item: RiskContribution;
}

export function ContributionBar({ item }: ContributionBarProps) {
  const pct = Math.min(item.contribution * 100, 100);
  const level = scoreToLevel(item.score);

  return (
    <div className="contribution-bar">
      <div className="contribution-bar__header">
        <span className="contribution-bar__source">{item.source}</span>
        <span className="contribution-bar__weight">权重 {(item.weight * 100).toFixed(0)}%</span>
      </div>
      <div className="contribution-bar__track">
        <div
          className="contribution-bar__fill"
          style={{ width: `${pct}%`, background: riskColor(level) }}
        />
      </div>
      <div className="contribution-bar__score">
        分数: {item.score.toFixed(1)} → 贡献: {item.contribution.toFixed(1)}
      </div>
      <DriverTags drivers={item.drivers} />
    </div>
  );
}
