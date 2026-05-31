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
    <div className="param-sliders">
      <div className="param-sliders__row">
        <label className="param-sliders__label">
          <span>退出阈值</span>
          <span className="param-sliders__value">{params.exit_threshold}</span>
        </label>
        <input
          type="range" min={20} max={100} step={5}
          value={params.exit_threshold}
          onChange={(e) => update("exit_threshold", +e.target.value)}
          className="param-sliders__input"
        />
        <span className="param-sliders__hint">
          风险 &ge; {params.exit_threshold} 时全部退出
        </span>
      </div>

      <div className="param-sliders__row">
        <label className="param-sliders__label">
          <span>减仓阈值</span>
          <span className="param-sliders__value">{params.reduce_threshold}</span>
        </label>
        <input
          type="range" min={10} max={90} step={5}
          value={params.reduce_threshold}
          onChange={(e) => update("reduce_threshold", +e.target.value)}
          className="param-sliders__input"
        />
        <span className="param-sliders__hint">
          风险 &ge; {params.reduce_threshold} 时开始减仓
        </span>
      </div>

      <div className="param-sliders__row">
        <label className="param-sliders__label">
          <span>初始仓位</span>
          <span className="param-sliders__value">{params.initial_exposure}%</span>
        </label>
        <input
          type="range" min={10} max={100} step={10}
          value={params.initial_exposure}
          onChange={(e) => update("initial_exposure", +e.target.value)}
          className="param-sliders__input"
        />
      </div>

      <button className="param-sliders__reset" onClick={onReset}>
        重置默认参数
      </button>
    </div>
  );
}
