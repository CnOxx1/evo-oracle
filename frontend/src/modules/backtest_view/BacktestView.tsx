import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, BacktestParams } from "../../api/client";
import { LunaTimelineChart } from "./LunaTimelineChart";
import { ResultSummary } from "./ResultSummary";
import { ParamSliders } from "./ParamSliders";
import { EventTimeline } from "./EventTimeline";

const DEFAULT_PARAMS: BacktestParams = {
  exit_threshold: 70,
  reduce_threshold: 50,
  initial_exposure: 100,
};

export function BacktestView() {
  const [params, setParams] = useState<BacktestParams>(DEFAULT_PARAMS);

  const { data, isLoading, error } = useQuery({
    queryKey: ["backtest-luna", params],
    queryFn: () => api.backtestLuna(params),
  });

  const handleReset = useCallback(() => setParams(DEFAULT_PARAMS), []);

  if (error) return <div className="error">回测数据不可用</div>;

  return (
    <section className="backtest-view">
      <h2>LUNA 崩盘交互式回测</h2>
      <p className="subtitle">
        2022-05-07 ~ 2022-05-13 | 调整参数，实时对比 EvoOracle 保护效果
      </p>

      <ParamSliders params={params} onChange={setParams} onReset={handleReset} />

      {isLoading && <div className="loading">计算中...</div>}

      {data && (
        <>
          <ResultSummary summary={data.summary} />
          <LunaTimelineChart series={data.series} />
          <EventTimeline series={data.series} />
        </>
      )}
    </section>
  );
}
