import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import { WorkerProvider } from "./worker-context";

ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <WorkerProvider>
      <App />
    </WorkerProvider>
  </React.StrictMode>
);
import React, { createContext, useContext, useEffect, useState } from "react";

type WorkerContextType = {
  query: (sql: string, params?: (string | number)[]) => Promise<any[]>;
};

const WorkerContext = createContext<WorkerContextType | null>(null);

export function WorkerProvider({ children }: { children: React.ReactNode }) {
  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    const workerInstance = new Worker(new URL("./worker.ts", import.meta.url));
    setWorker(workerInstance);

    return () => {
      workerInstance.terminate();
    };
  }, []);

  const query = async (sql: string, params: (string | number)[] = []) => {
    if (!worker) throw new Error("Worker not initialized");
    
    const id = Math.random().toString(36).substring(2, 9);
    return new Promise<any[]>((resolve) => {
      const handler = (e: MessageEvent) => {
        if (e.data.id === id) {
          worker.removeEventListener("message", handler);
          resolve(e.data.result);
        }
      };
      worker.addEventListener("message", handler);
      worker.postMessage([id, sql, params]);
    });
  };

  return (
    <WorkerContext.Provider value={{ query }}>
      {children}
    </WorkerContext.Provider>
  );
}

export function useWorker() {
  const context = useContext(WorkerContext);
  if (!context) {
    throw new Error("useWorker must be used within a WorkerProvider");
  }
  return context;
}
