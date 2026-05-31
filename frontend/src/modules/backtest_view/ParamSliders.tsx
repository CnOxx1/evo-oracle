import { BacktestParams } from "../../api/client";

interface ParamSlidersProps {
  params: BacktestParams;
  onChange: (params: BacktestParams) => void;
  onReset: () => void;
}

export function ParamSliders({ params, onChange, onReset }: ParamSlidersProps) {
  const update = (key: keyof BacktestParams, value: number) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="glass-card p-5 mb-6">
      <div className="mb-4">
        <label className="flex justify-between text-sm mb-1">
          <span>退出阈值</span>
          <span className="text-accent font-bold">{params.exit_threshold}</span>
        </label>
        <input
          type="range" min={20} max={100} step={5}
          value={params.exit_threshold}
          onChange={(e) => update("exit_threshold", +e.target.value)}
          className="w-full accent-accent h-1.5 cursor-pointer"
        />
        <span className="block text-[0.7rem] text-text-secondary mt-0.5">
          风险 &ge; {params.exit_threshold} 时全部退出
        </span>
      </div>

      <div className="mb-4">
        <label className="flex justify-between text-sm mb-1">
          <span>减仓阈值</span>
          <span className="text-accent font-bold">{params.reduce_threshold}</span>
        </label>
        <input
          type="range" min={10} max={90} step={5}
          value={params.reduce_threshold}
          onChange={(e) => update("reduce_threshold", +e.target.value)}
          className="w-full accent-accent h-1.5 cursor-pointer"
        />
        <span className="block text-[0.7rem] text-text-secondary mt-0.5">
          风险 &ge; {params.reduce_threshold} 时开始减仓
        </span>
      </div>

      <div className="mb-3">
        <label className="flex justify-between text-sm mb-1">
          <span>初始仓位</span>
          <span className="text-accent font-bold">{params.initial_exposure}%</span>
        </label>
        <input
          type="range" min={10} max={100} step={10}
          value={params.initial_exposure}
          onChange={(e) => update("initial_exposure", +e.target.value)}
          className="w-full accent-accent h-1.5 cursor-pointer"
        />
      </div>

      <button
        className="bg-bg-secondary text-text-secondary border border-border rounded-lg px-3 py-1.5 text-xs cursor-pointer hover:border-accent hover:text-text-primary transition-colors"
        onClick={onReset}
      >
        重置默认参数
      </button>
    </div>
  );
}
