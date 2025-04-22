import sqlite3InitModule, { OpfsDatabase } from "@sqlite.org/sqlite-wasm";

/** A promise that resolves to the DB file as a buffer */
const filePromise: Promise<ArrayBuffer> = (async () => {
  const reaponse = await fetch("/smartwater/tanks.db");
  const file = await reaponse.arrayBuffer();
  return file;
})();

/** A promise that resolves to a hydrated DB */
const dbPromise: Promise<OpfsDatabase> = (async () => {
  const [sqlite3, file] = await Promise.all([
    sqlite3InitModule({}),
    filePromise,
  ]);
  // Import the file into OPFS
  await sqlite3.oo1.OpfsDb.importDb("tanks.db", file);
  // Open the file (Set flags to "r" to debug)
  return new sqlite3.oo1.OpfsDb("tanks.db", "r");
})();

export type QueryMessage = {
  id: string;
  sql: string;
  params: (string | number)[];
};

export type QueryResult =
  | {
      id: number;
      result: Record<string, any>[];
    }
  | {
      id: number;
      error: string;
    };

onmessage = async (e: MessageEvent<QueryMessage>) => {
  const { id, sql, params } = e.data;
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
    console.error("Error while querying", error);
    postMessage({
      id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
