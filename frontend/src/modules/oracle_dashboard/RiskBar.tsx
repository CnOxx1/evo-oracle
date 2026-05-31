import { riskColor } from "../../lib/format";

interface RiskBarProps {
  score: number;
  level: string;
}

export function RiskBar({ score, level }: RiskBarProps) {
  return (
    <div className="risk-bar">
      <div className="risk-bar__track">
        <div
          className="risk-bar__fill"
          style={{ width: `${score}%`, background: riskColor(level) }}
        />
      </div>
      <span className="risk-bar__label" style={{ color: riskColor(level) }}>
        {score.toFixed(0)}
      </span>
    </div>
  );
}
