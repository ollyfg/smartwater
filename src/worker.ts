import { expose, wrap } from "comlink";
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

interface Tank {
  id: number;
  name: string;
}

interface WaterLevel {
  tank: number;
  level: number;
  timestamp: string;
}

const worker = {
  async initDB() {
    const sqlite3 = await sqlite3InitModule({
      locateFile: (file) => `https://sqlite.org/wasm/${file}`,
    });

    const db = new sqlite3.oo1.DB("/tanks.db", "ct");
    return db;
  },

  async getTanks(): Promise<Tank[]> {
    const db = await this.initDB();
    return db.exec("SELECT id, name FROM tanks", { returnValue: "resultRows" });
  },

  async getRecentLevels(): Promise<Record<number, WaterLevel>> {
    const db = await this.initDB();
    const levels = db.exec(
      `
      SELECT tank, level, MAX(timestamp) as timestamp 
      FROM water_levels 
      GROUP BY tank
    `,
      { returnValue: "resultRows" }
    );

    return levels.reduce((acc, level) => {
      acc[level.tank] = level;
      return acc;
    }, {});
  },
};

expose(worker);
export type WorkerType = typeof worker;
export const initWorker = () =>
  wrap<WorkerType>(new Worker(new URL("./worker.ts", import.meta.url)));
