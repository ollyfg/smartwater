import { FirebaseOptions, initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore/lite";
import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";
import path from "path";

const requiredEnvVars = [
  "SMARTWATER_API_KEY",
  "SMARTWATER_USERNAME",
  "SMARTWATER_PASSWORD",
];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    throw Error(`Missing required env var: ${varName}`);
  }
}

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.SMARTWATER_API_KEY!,
  databaseURL: "https://smartwater-app.firebaseio.com",
  projectId: "smartwater-app",
  storageBucket: "smartwater-app.appspot.com",
  appId: "smartwater-app",
};

const rootDir = path.normalize(path.join(__dirname, "..", ".."));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const store = getFirestore(app);

async function getDocument(collectionName: string, path: string) {
  const document = await getDoc(doc(collection(store, collectionName), path));
  return document.exists() ? document.data() : null;
}

async function queryDocuments(
  collectionName: string,
  key: string,
  value: string
) {
  const queryObjet = query(
    collection(store, collectionName),
    where(key, "==", value)
  );
  const result = await getDocs(queryObjet);
  return result.docs.map((x) => x.data());
}

/** Get the tanks and levels from SmartWater */
async function scrape() {
  try {
    // Sign in to SmartWater
    await signInWithEmailAndPassword(
      auth,
      process.env.SMARTWATER_USERNAME!,
      process.env.SMARTWATER_PASSWORD!
    );
    console.log("Logged in");

    // Get the profile, which has our all-important `gatewayId`.
    const profile = await getDocument("profiles", auth.currentUser!.uid);
    const { gatewayId } = profile!.accountConfig.basicAccountConfig;

    // Get the tanks.
    const tanks = (
      await queryDocuments("devices", "gatewayId", gatewayId)
    ).filter((x) => x.type === "tank" && x.status === "connected");

    // Some nice logging
    for (const tank of tanks) {
      console.log(
        `Got tank level for ${tank.settings.name}: ${tank.waterLevel}%`
      );
    }

    return tanks;
  } finally {
    signOut(auth);
    console.log("Logged out");
  }
}

// Write the results to the DB file
async function writeResults(tanks: any[]) {
  let db: Database | null = null;
  try {
    db = await open({
      filename: path.join(rootDir, "tanks.db"),
      driver: sqlite3.Database,
    });

    // If needed, create our basic tables
    await db.exec(
      `CREATE TABLE IF NOT EXISTS tanks (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      );`
    );
    await db.exec(
      `CREATE TABLE IF NOT EXISTS water_levels (
        id INTEGER PRIMARY KEY,
        tank INTEGER,
        level INTEGER NOT NULL,
        FOREIGN KEY (tank)
          REFERENCES tanks (tank)
            ON DELETE CASCADE
      );`
    );

    for (const tank of tanks) {
      // Upsert the tanks
      await db.run(
        `INSERT INTO tanks(id, name)
            VALUES (:id, :name)
            ON CONFLICT (id) DO
              UPDATE SET name = excluded.name;
        `,
        {
          ":id": tank.serialNumber,
          ":name": tank.settings.name ?? "New Tank",
        }
      );

      // Insert the current water level
      await db.run(
        `INSERT INTO water_levels (tank, level)
          VALUES (:tank, :level)`,
        {
          ":tank": tank.serialNumber,
          ":level": tank.waterLevel,
        }
      );
    }
  } finally {
    await db?.close();
  }
}

(async () => {
  const tanks = await scrape();
  await writeResults(tanks);
})();
import { defineConfig } from 'vite'
import { comlink } from 'vite-plugin-comlink'

export default defineConfig({
  plugins: [comlink()],
  worker: {
    plugins: [comlink()],
  },
})
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tank Levels</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
import { initWorker } from './worker'
import './style.css'

const app = document.getElementById('app')!
app.innerHTML = `
  <h1>Tank Levels</h1>
  <div class="loading">Loading...</div>
  <div class="tank-list"></div>
`

async function main() {
  const worker = await initWorker()
  
  try {
    const tanks = await worker.getTanks()
    const levels = await worker.getRecentLevels()
    
    const tankList = document.querySelector('.tank-list')!
    tankList.innerHTML = tanks.map(tank => `
      <div class="tank">
        <h2>${tank.name}</h2>
        <div class="level">Current: ${levels[tank.id]?.level || 'N/A'}%</div>
      </div>
    `).join('')
    
    document.querySelector('.loading')!.remove()
  } catch (err) {
    app.innerHTML = `<div class="error">Error loading tank data: ${err.message}</div>`
  }
}

main()
import { expose } from 'comlink'
import sqlite3InitModule from '@sqlite.org/sqlite-wasm'

interface Tank {
  id: number
  name: string
}

interface WaterLevel {
  tank: number
  level: number
  timestamp: string
}

const worker = {
  async initDB() {
    const sqlite3 = await sqlite3InitModule({
      locateFile: file => `https://sqlite.org/wasm/${file}`
    })
    
    const db = new sqlite3.oo1.DB('/tanks.db', 'ct')
    return db
  },

  async getTanks(): Promise<Tank[]> {
    const db = await this.initDB()
    return db.exec('SELECT id, name FROM tanks', { returnValue: 'resultRows' })
  },

  async getRecentLevels(): Promise<Record<number, WaterLevel>> {
    const db = await this.initDB()
    const levels = db.exec(`
      SELECT tank, level, MAX(timestamp) as timestamp 
      FROM water_levels 
      GROUP BY tank
    `, { returnValue: 'resultRows' })
    
    return levels.reduce((acc, level) => {
      acc[level.tank] = level
      return acc
    }, {})
  }
}

expose(worker)
export type WorkerType = typeof worker
export const initWorker = () => Comlink.wrap<WorkerType>(new Worker(new URL('./worker.ts', import.meta.url)))
body {
  font-family: system-ui, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.tank {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.error {
  color: #d32f2f;
  padding: 1rem;
  background: #ffebee;
  border-radius: 4px;
}
