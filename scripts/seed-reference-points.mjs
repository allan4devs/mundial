import fs from "fs";
import url from "url";

import path from "path";
import { MongoClient } from "mongodb";

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
}

function randBetween(min, max) {
  return Math.random() * (max - min) + min;
}

async function main() {
  const __filename = url.fileURLToPath(import.meta.url);
  const repoRoot = path.resolve(path.dirname(__filename), "..");
  const envPath = path.join(repoRoot, ".env");
  const referencePointsPath = path.join(repoRoot, "lib", "transport", "reference-points.json");
  loadEnv(envPath);

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "lva";

  if (!uri) {
    console.error("MONGODB_URI not found in environment or .env");
    process.exit(1);
  }

  const argCountIndex = process.argv.findIndex((a) => a === "--count" || a === "-c");
  const count = argCountIndex >= 0 ? Number(process.argv[argCountIndex + 1]) || 1000 : 1000;
  const collectionName = "reference_points";

  console.log(`Connecting to MongoDB ${dbName} ...`);
  const client = new MongoClient(uri, { maxPoolSize: 10 });
  await client.connect();
  const db = client.db(dbName);
  const coll = db.collection(collectionName);

  const namedPoints = JSON.parse(fs.readFileSync(referencePointsPath, "utf8"));

  // Bulk operations array
  const ops = [];

  // Upsert named points first
  for (const p of namedPoints) {
    ops.push({
      updateOne: {
        filter: { id: p.id },
        update: {
          $set: {
            id: p.id,
            name: p.name,
            lat: p.lat,
            lng: p.lng,
            category: p.category || "reference",
            source: "seed",
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        upsert: true,
      },
    });
  }

  // Generate synthetic points across Costa Rica bounding box
  // Costa Rica approx bbox: lat 8.0 - 11.5, lng -85.0 - -82.0
  const target = Math.max(0, count - namedPoints.length);
  for (let i = 0; i < target; i++) {
    const lat = Number(randBetween(8.0, 11.5).toFixed(6));
    const lng = Number(randBetween(-85.0, -82.0).toFixed(6));
    const id = `seed-point-${String(i + 1).padStart(5, "0")}`;
    ops.push({
      updateOne: {
        filter: { id },
        update: {
          $set: {
            id,
            name: `Seed Point ${i + 1}`,
            lat,
            lng,
            category: "synthetic",
            source: "seed",
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        upsert: true,
      },
    });
    // execute in batches to avoid too large bulk
    if (ops.length >= 500) {
      console.log(`Executing batch of ${ops.length} operations...`);
      const res = await coll.bulkWrite(ops, { ordered: false });
      console.log(`Batch result:`, { inserted: res.upsertedCount, modified: res.modifiedCount });
      ops.length = 0;
    }
  }

  if (ops.length > 0) {
    console.log(`Executing final batch of ${ops.length} operations...`);
    const res = await coll.bulkWrite(ops, { ordered: false });
    console.log(`Final batch result:`, { upserted: res.upsertedCount, modified: res.modifiedCount });
  }

  // Create index on id and geospatial index if desired
  try {
    await coll.createIndex({ id: 1 }, { unique: true });
    await coll.createIndex({ lat: 1, lng: 1 });
  } catch (e) {
    console.warn("Index creation warning:", e.message || e);
  }

  console.log(`Seed complete. Collection: ${db.databaseName}.${collectionName}`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

