import sqlite3InitModule, { Database } from "@sqlite.org/sqlite-wasm";

const dbPromise: Promise<Database> = (async () => {
  const sqlite3 = await sqlite3InitModule({});
  return new sqlite3.oo1.DB("/tanks.db", "r");
})();

type QueryMessage = {
  id: string;
  sql: string;
  params: (string | number)[];
};

onmessage = async (e: MessageEvent<[string, string, (string | number)[]]>) => {
  const [id, sql, params] = e.data;
  try {
    const db = await dbPromise;
    const result = db.exec({
      sql,
      bind: params,
      returnValue: "resultRows",
      rowMode: "object",
    });
    postMessage({ id, result });
  } catch (error) {
    postMessage({ id, error: error instanceof Error ? error.message : "Unknown error" });
  }
};
