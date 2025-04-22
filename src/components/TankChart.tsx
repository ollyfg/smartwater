import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import React from "react";
import { useSql } from "../contexts/sqlite";
import { Tank, WaterLevel } from "../models";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function TankChart() {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [levels, setLevels] = useState<Record<number, WaterLevel[]>>({});
  const { query, workerReady } = useSql();

  useEffect(() => {
    async function loadData() {
      if (workerReady) {
        const [allLevels, tanks] = await Promise.all([
          query<WaterLevel>("SELECT * FROM water_levels ORDER BY date"),
          query<Tank>("SELECT * FROM tanks"),
        ]);

        setTanks(tanks);
        const levels = tanks.reduce((agg, x) => {
          agg[x.id] = allLevels.filter((y) => y.tank === x.id);
          return agg;
        }, {});
        setLevels(levels);
      }
    }
    loadData();
  }, [workerReady]);

  if (!Object.values(levels).length) {
    return <></>;
  }

  // Color palette for tanks
  const tankColors = [
    "rgb(75, 192, 192)",  // teal
    "rgb(255, 99, 132)",  // red
    "rgb(54, 162, 235)",  // blue
    "rgb(255, 206, 86)",  // yellow
    "rgb(153, 102, 255)", // purple
    "rgb(255, 159, 64)",  // orange
    "rgb(199, 199, 199)", // gray
  ];

  const chartData = {
    labels: Object.values(levels)[0].map((l) => l.date),
    datasets: tanks.map((tank, index) => ({
      label: tank.name,
      data: levels[tank.id].map((l) => l.level),
      borderColor: tankColors[index % tankColors.length],
      backgroundColor: tankColors[index % tankColors.length] + "40", // Add transparency
      borderWidth: 2,
      pointRadius: 3,
      tension: 0.1,
    })),
  };

  return (
    <div className="chart-container">
      <Line data={chartData} />
    </div>
  );
}
