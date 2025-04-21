import React from "react";
import { useState, useEffect } from "react";
import TankChart from "./components/TankChart";
import { useWorker } from "./worker-context";

export default function App() {
  const [tanks, setTanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { query } = useWorker();

  useEffect(() => {
    async function loadData() {
      try {
        const tankList = await query("SELECT * FROM tanks");
        setTanks(tankList);
      } catch (err) {
        console.log("Failed to load tanks", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [query]);

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
