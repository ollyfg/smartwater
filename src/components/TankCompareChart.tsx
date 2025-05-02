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
import { COLORS, MONTHS, Tank, WaterLevel } from "../models";
import { groupBy, uniqBy } from "lodash-es";
import {
  addDays,
  addMonths,
  daysToWeeks,
  endOfYear,
  formatDate,
  getDayOfYear,
  getMonth,
  startOfDay,
  startOfYear,
  subDays,
} from "date-fns";

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

type TankCompareChartProps = { tankId: number };

/**
 * Render a graph of the year, with previous years overlayed
 */
export default function TankCompareChart({ tankId }: TankCompareChartProps) {
  const [levels, setLevels] = useState<Record<string, WaterLevel[]>>({});
  const { query, workerReady } = useSql();

  useEffect(() => {
    async function loadData() {
      if (workerReady) {
        // Query levels for the tank we want to show
        const allLevels = await query<WaterLevel>(
          "SELECT * FROM water_levels WHERE tank = ? ORDER BY date ASC",
          [tankId]
        );

        const levels = groupBy(allLevels, (level) => startOfYear(level.date));
        setLevels(levels);
      }
    }
    loadData();
  }, [workerReady, tankId]);

  const numberOfDatasets = Object.values(levels).length;
  if (numberOfDatasets === 0) {
    return <></>;
  }

  const jan1st = startOfYear(new Date());
  const dec31st = endOfYear(new Date());

  const labels = [];
  for (let i = 0; i < 12; i++) {
    labels.push(addMonths(jan1st, i));
  }

  const chartData: ChartData<"line", { x: Date; y: number }[], string> = {
    labels,
    datasets: Object.entries(levels).map(([start, points], index) => ({
      label: formatDate(start, "yyyy"),
      data: points.map((l) => ({
        x: addDays(jan1st, getDayOfYear(l.date)),
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
        min: jan1st.toISOString(),
        max: dec31st.toISOString(),
        ticks: {
          source: "labels",
          callback: (value) => {
            const month = getMonth(value);
            return MONTHS[month];
          },
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
      tooltip: {
        enabled: true,
        mode: "x",
        filter: (item, _i, items) => {
          const firstItemInDataset = items.find(
            (x) => x.datasetIndex === item.datasetIndex
          );
          return item === firstItemInDataset;
        },
        callbacks: {
          title: (item) => {
            const date = item[0].parsed.x;
            return formatDate(date, "do MMM h:mmaaa");
          },
        },
      },
    },
  };

  return (
    <div style={{ position: "relative", height: "400px", width: "100%" }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}
