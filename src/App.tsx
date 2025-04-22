import React from "react";
import { useState, useEffect } from "react";
import { useSql } from "./contexts/sqlite";
import TankDateChart from "./components/TankDateChart";

export default function App() {
  const [tanks, setTanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { query, workerReady } = useSql();

  useEffect(() => {
    async function loadData() {
      if (workerReady) {
        try {
          const tankList = await query("SELECT * FROM tanks");
          setTanks(tankList);
        } catch (err) {
          console.log("Failed to register worker", err);
          setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
          setLoading(false);
        }
      }
    }
    loadData();
  }, [workerReady]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="app">
      <h1>Water Tank Levels</h1>
      <div className="charts">
        <TankDateChart />
      </div>
    </div>
  );
}
