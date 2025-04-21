import React from "react";
import { useState, useEffect } from "react";
// import { TankWorkerType } from "./worker";
import TankChart from "./components/TankChart";

export default function App() {
  const [tanks, setTanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        console.log("Registering worker");
        const myWorker = new Worker(new URL("worker.ts", import.meta.url));

        const msg = [Math.random() * 10, Math.random() * 10];
        myWorker.postMessage(msg);
        console.log("Message posted to worker", msg);

        myWorker.onmessage = (e) => {
          console.log("Message received from worker", e.data);
        };
        // const tankList = await worker.getTanks();
        // console.log("Got tanks", tankList);
        // setTanks(tankList);
      } catch (err) {
        console.log("Failed to register worker", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="app">
      <h1>Water Tank Levels</h1>
      <div className="charts">
        {tanks.map((tank) => (
          <TankChart key={tank.id} tankId={tank.id} name={tank.name} />
        ))}
      </div>
    </div>
  );
}
