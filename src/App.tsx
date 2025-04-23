import React from "react";
import { useState, useEffect } from "react";
import { useSql } from "./contexts/sqlite";
import TankDateChart from "./components/TankDateChart";
import ChartSelector from "./components/ChartSelector";
import { CHART_TYPE, CHART_TYPES, DATE_OPTIONS, Tank } from "./models";
import TankCompareChart from "./components/TankCompareChart";

export default function App() {
  const { query, workerReady } = useSql();
  const [type, setType] = useState<CHART_TYPE>(CHART_TYPES[0]);
  const [days, setDays] = useState<number>(DATE_OPTIONS[0]);
  const [tanks, setTanks] = useState<Tank[]>();
  const [tankId, setTankId] = useState<number>();

  useEffect(() => {
    async function loadData() {
      if (workerReady) {
        const tanks = await query<Tank>("SELECT * FROM tanks");
        setTanks(tanks);
        setTankId(tanks[0].id);
      }
    }
    loadData();
  }, [workerReady]);

  if (!workerReady || !tanks) return <div>Loading...</div>;

  return (
    <div className="app">
      <h1>Water Tank Levels</h1>
      <div className="chart-container">
        <ChartSelector
          onTypeChange={setType}
          onDaysChange={setDays}
          onTankChange={setTankId}
          tanks={tanks}
          type={type}
          days={days}
          tankId={tankId}
        />
        {type === "DATE" ? (
          <TankDateChart days={days} tanks={tanks} />
        ) : tankId ? (
          <TankCompareChart tankId={tankId} />
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}
