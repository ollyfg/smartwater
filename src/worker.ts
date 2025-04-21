import sqlite3InitModule, { Database } from "@sqlite.org/sqlite-wasm";

const dbPromise: Promise<Database> = (async () => {
  const sqlite3 = await sqlite3InitModule({});
  return new sqlite3.oo1.DB("/tanks.db", "r");
})();

export type Query = [number, string, (string | number)[]];

onmessage = async (e: MessageEvent<Query>) => {
  const [id, query, params] = e.data;
  const db = await dbPromise;
  const result = db.exec({
    sql: query,
    bind: params,
    returnValue: "resultRows",
    rowMode: "object",
  });
  postMessage({
    id,
    result,
  });
};
