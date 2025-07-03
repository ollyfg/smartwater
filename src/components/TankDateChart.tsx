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
import { COLORS, Tank, WaterLevel } from "../models";
import { formatDate, startOfDay, subDays } from "date-fns";

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

type TankDateChartProps = {
  days: number;
  tanks: Tank[];
};

export default function TankDateChart({ days, tanks }: TankDateChartProps) {
  const [levels, setLevels] = useState<Record<number, WaterLevel[]>>({});
  const { query, workerReady } = useSql();

  useEffect(() => {
    console.log("Days changed", days);
  }, [days]);

  useEffect(() => {
    async function loadData() {
      if (workerReady) {
        // Query just the days we want to show
        let levelQuery = "SELECT * FROM water_levels ORDER BY date ASC";
        let levelParams: (string | number)[] = [];
        if (Number.isFinite(days)) {
          levelQuery =
            "SELECT * FROM water_levels WHERE date > ? ORDER BY date ASC";
          levelParams = [startOfDay(subDays(new Date(), days)).toISOString()];
        }

        const allLevels = await query<WaterLevel>(levelQuery, levelParams);

        const levels = tanks.reduce((agg, x) => {
          agg[x.id] = allLevels.filter((y) => y.tank === x.id);
          return agg;
        }, {});
        setLevels(levels);
      }
    }
    loadData();
  }, [workerReady, days]);

  const numberOfDatasets = Object.values(levels).length;
  if (numberOfDatasets === 0) {
    return <></>;
  }

  const chartData: ChartData<"line", { x: string; y: number }[], string> = {
    datasets: tanks.map((tank, index) => ({
      label: tank.name,
      data: levels[tank.id].map((l) => ({
        x: l.date,
        y: l.level / 100,
      })),
      borderColor: COLORS[index % COLORS.length],
      backgroundColor: COLORS[index % COLORS.length],
      borderWidth: 2,
      pointRadius: 3,
      tension: 0.1,
      indexAxis: "x",
    })),
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: window.devicePixelRatio * 2,
    elements: {
      point: {
        pointStyle: false,
      },
    },
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
          round: "hour",
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
        display: numberOfDatasets > 1,
        position: "bottom",
      },
      tooltip: {
        enabled: true,
        mode: "x",
        callbacks: {
          title: (item) => {
            const date = item[0].parsed.x;
            return formatDate(date, "do MMM y h:mmaaa");
          },
        },
      },
    },
  };

  return (
    <div className="chart-wrapper">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}
