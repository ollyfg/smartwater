import React from "react";
import {
  CHART_TYPE,
  CHART_TYPES,
  CHART_TYPE_DESCRIPTIONS,
  DATE_OPTIONS,
  Tank,
} from "../models";

type ChartSelectorProps = {
  onTypeChange: (type: CHART_TYPE) => void;
  onDaysChange: (date: number) => void;
  onTankChange: (tankId: number) => void;
  type: CHART_TYPE;
  days: number;
  tankId?: number;
  tanks?: Tank[];
};

export default function ChartSelector({
  onTypeChange,
  onDaysChange,
  onTankChange,
  type,
  days,
  tanks,
  tankId,
}: ChartSelectorProps) {
  return (
    <div className="chart-controls">
      <select
        className="type-selector"
        value={type}
        onChange={(e) => onTypeChange(e.target.value as CHART_TYPE)}
        aria-label="Select chart type"
      >
        {CHART_TYPES.map((type) => (
          <option key={type} value={type}>
            {CHART_TYPE_DESCRIPTIONS[type]}
          </option>
        ))}
      </select>
      <div className="spacer"></div>
      {type === "DATE" ? (
        <select
          className="date-selector"
          value={days}
          onChange={(e) => onDaysChange(Number(e.target.value))}
          aria-label="Select date range"
        >
          {DATE_OPTIONS.filter(
            (days) => type === "DATE" || Number.isFinite(days)
          ).map((days) => (
            <option key={days} value={days}>
              {Number.isFinite(days) ? `Last ${days} days` : "All time"}
            </option>
          ))}
        </select>
      ) : tanks ? (
        <select
          className="tank-selector"
          value={tankId}
          onChange={(e) => onTankChange(Number(e.target.value))}
          aria-label="Select water tank"
        >
          {tanks.map((tank) => (
            <option key={tank.id} value={tank.id}>
              {tank.name}
            </option>
          ))}
        </select>
      ) : (
        <></>
      )}
    </div>
  );
}
