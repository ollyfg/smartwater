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
