import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import "chartjs-adapter-date-fns";
import React from "react";
import { useSql } from "../contexts/sqlite";
import { Tank, WaterLevel } from "../models";
import { uniqBy } from "lodash-es";
import { startOfDay, subDays } from "date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DATE_OPTIONS = [30, 90, 365, Infinity];

export default function TankDateChart() {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [levels, setLevels] = useState<Record<number, WaterLevel[]>>({});
  const [daysToShow, setDays] = useState(DATE_OPTIONS[0]);
  const { query, workerReady } = useSql();

  useEffect(() => {
    async function loadData() {
      if (workerReady) {
        // Query just the days we want to show
        let levelQuery = "SELECT * FROM water_levels ORDER BY date DESC";
        let levelParams: (string | number)[] = [];
        if (Number.isFinite(daysToShow)) {
          levelQuery =
            "SELECT * FROM water_levels WHERE date > ? ORDER BY date";
          levelParams = [
            startOfDay(subDays(new Date(), daysToShow)).toUTCString(),
          ];
        }

        const [allLevels, tanks] = await Promise.all([
          query<WaterLevel>(levelQuery, levelParams),
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
  }, [workerReady, daysToShow]);

  if (!Object.values(levels).length) {
    return <></>;
  }

  // Color palette for tanks
  const tankColors = [
    "rgb(75, 192, 192)", // teal
    "rgb(255, 99, 132)", // red
    "rgb(54, 162, 235)", // blue
    "rgb(255, 206, 86)", // yellow
    "rgb(153, 102, 255)", // purple
    "rgb(255, 159, 64)", // orange
    "rgb(199, 199, 199)", // gray
  ];

  // Labels
  const labels = uniqBy(
    Object.values(levels).flatMap((x) => x.map((y) => y.date)),
    (date) => startOfDay(date)
  );

  const chartData: ChartData<"line", { x: string; y: number }[], string> = {
    labels,
    datasets: tanks.map((tank, index) => ({
      label: tank.name,
      data: levels[tank.id].map((l) => ({
        x: l.date,
        y: l.level / 100,
      })),
      borderColor: tankColors[index % tankColors.length],
      backgroundColor: tankColors[index % tankColors.length],
      borderWidth: 2,
      pointRadius: 3,
      tension: 0.1,
      indexAxis: "x",
    })),
  };

  const chartOptions: ChartOptions<"line"> = {
    scales: {
      y: {
        type: "linear",
        beginAtZero: true,
        max: 1,
        ticks: {
          autoSkip: true,
          stepSize: 0.01,
          format: {
            style: "percent",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          },
        },
      },
      x: {
        type: "time",
        ticks: {
          source: "auto",
        },
        time: {
          round: "day",
          minUnit: "hour",
        },
      },
    },
    interaction: {
      mode: "nearest",
    },
    plugins: {
      decimation: {
        enabled: true,
        algorithm: "min-max",
      },
      legend: {
        display: true,
        position: "bottom",
      },
    },
  };

  return (
    <div className="chart-container">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}
