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
