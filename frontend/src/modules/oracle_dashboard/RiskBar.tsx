import { riskBgClass, riskTextClass } from "../../lib/format";

interface RiskBarProps {
  score: number;
  level: string;
}

export function RiskBar({ score, level }: RiskBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${riskBgClass(level)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-sm font-bold min-w-[2rem] text-right ${riskTextClass(level)}`}>
        {score.toFixed(0)}
      </span>
    </div>
  );
}
