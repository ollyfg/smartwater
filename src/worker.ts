import type { Tank, WaterLevel } from "./models";
import { expose } from "comlink";
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

let db: any = null;

class TankWorker {
  async initDB() {
    if (!db) {
      const sqlite3 = await sqlite3InitModule({});
      db = new sqlite3.oo1.DB("/tanks.db", "r");
    }
    return db;
  }

  async getTanks(): Promise<Tank[]> {
    await this.initDB();
    return db.exec("SELECT id, name FROM tanks", { returnValue: "resultRows" });
  }

  async getRecentLevels(
    tankId: number,
    days: number = 30
  ): Promise<WaterLevel[]> {
    await this.initDB();
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
}

const worker = new TankWorker();
expose(worker);
export type TankWorkerType = typeof worker;
