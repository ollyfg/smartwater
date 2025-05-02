/** A tank, as stored in the DB */
export type Tank = {
  id: number;
  name: string;
};

/** A record of the waterlevel for a tank at a given date */
export type WaterLevel = {
  id: number;
  /** The `Tank` ID */
  tank: number;
  /** The water level, as a percentage */
  level: number;
  /** The date of the record, as an ISO datetime string */
  date: string;
};

/** The types of chart we can show */
export const CHART_TYPE_DESCRIPTIONS = {
  DATE: "Date View",
  COMPARE: "Compare years",
} as const;
export type CHART_TYPE = keyof typeof CHART_TYPE_DESCRIPTIONS;
export const CHART_TYPES = Object.keys(CHART_TYPE_DESCRIPTIONS) as CHART_TYPE[];

/** Options for DATE charts */
export const DATE_OPTIONS = [30, 90, 365, Infinity];

// Color palette for tanks
export const COLORS = [
  "rgb(75, 192, 192)", // teal
  "rgb(255, 99, 132)", // red
  "rgb(54, 162, 235)", // blue
  "rgb(255, 206, 86)", // yellow
  "rgb(153, 102, 255)", // purple
  "rgb(255, 159, 64)", // orange
  "rgb(199, 199, 199)", // gray
];

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
