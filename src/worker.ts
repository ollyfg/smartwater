import type { Tank, WaterLevel } from "./models";
import { expose, wrap } from "comlink";
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

let db: any = null;

async function initDB() {
  if (!db) {
    const sqlite3 = await sqlite3InitModule({});
    db = new sqlite3.oo1.DB("/tanks.db", "r");
  }
  return db;
}

async function getTanks(): Promise<Tank[]> {
  db = await initDB();
  return db.exec("SELECT id, name FROM tanks", { returnValue: "resultRows" });
}

async function getRecentLevels(
  tankId: number,
  days: number = 30
): Promise<WaterLevel[]> {
  db = await initDB();
  return db.exec(
    `SELECT level, timestamp 
     FROM water_levels 
     WHERE tank = ? 
     AND date(timestamp) >= date('now', ?) 
     ORDER BY timestamp`,
    [tankId, `-${days} days`],
    { returnValue: "resultRows" }
  );
}

const worker = {
  initDB,
  getTanks,
  getRecentLevels,
};

expose(worker);
export type WorkerType = typeof worker;

export const initWorker = () => {
  const workerInstance = wrap<WorkerType>(
    new Worker(new URL("./worker.ts", import.meta.url))
  );
  return workerInstance;
};

export { initDB, getTanks, getRecentLevels };
