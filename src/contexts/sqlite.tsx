import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { QueryResult } from "../worker";

// @ts-expect-error
import Worker from "../worker?worker";

type SqlContextType = {
  query: <TResult extends Record<string, any>>(
    sql: string,
    params?: (string | number)[]
  ) => Promise<TResult[]>;
  workerReady: boolean;
};

const SqlContext = createContext<SqlContextType | null>(null);

export function SqlProvider({ children }: { children: React.ReactNode }) {
  const [worker, setWorker] = useState<Worker | null>(null);
  const idCounter = useRef(0);

  useEffect(() => {
    const workerInstance = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    setWorker(workerInstance);

    return () => {
      workerInstance.terminate();
    };
  }, []);

  const query = async <TResult extends Record<string, any>>(
    sql: string,
    params: (string | number)[] = []
  ) => {
    if (!worker) {
      throw new Error("Worker not initialized");
    }

    const id = idCounter.current++;
    return new Promise<TResult[]>((resolve, reject) => {
      const handler = (e: MessageEvent<QueryResult>) => {
        if (e.data.id === id) {
          worker.removeEventListener("message", handler);
          if ("error" in e.data) {
            console.error(e.data.error);
            reject(e.data.error);
          } else {
            resolve(e.data.result as TResult[]);
          }
        }
      };
      worker.addEventListener("message", handler);
      worker.postMessage({ id, sql, params });
    });
  };

  return (
    <SqlContext.Provider value={{ query, workerReady: Boolean(worker) }}>
      {children}
    </SqlContext.Provider>
  );
}

export function useSql() {
  const context = useContext(SqlContext);
  if (!context) {
    throw new Error("useSql must be used within a SqlProvider");
  }
  return context;
}
