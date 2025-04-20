import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { getRecentLevels } from "../worker";
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
import { WaterLevel } from "../models";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function TankChart({
  tankId,
  name,
}: {
  tankId: number;
  name: string;
}) {
  const [levels, setLevels] = useState<WaterLevel[]>([]);

  useEffect(() => {
    async function loadLevels() {
      const data = await getRecentLevels(tankId, 30); // Last 30 days
      setLevels(data);
    }
    loadLevels();
  }, [tankId]);

  const chartData = {
    labels: levels.map((l) => l.date),
    datasets: [
      {
        label: `${name} Level`,
        data: levels.map((l) => l.level),
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="chart-container">
      <Line data={chartData} />
    </div>
  );
}
