import { MongoClient, type Db } from "mongodb";

export const SCORES_DB_NAME = process.env.SCORES_DB_NAME?.trim() || "go";

export const SCORES_COLLECTIONS = {
  COMPETITIONS: "competitions",
  MATCHES: "matches",
  PREDICTIONS: "predictions",
  IDENTITIES: "identities",
  SESSIONS: "sessions",
  ADMIN_AUDIT: "admin_audit",
  SYNC_STATE: "sync_state",
  PRIVATE_LEAGUES: "private_leagues",
  USER_ACHIEVEMENTS: "user_achievements",
  NOTIFICATION_DELIVERIES: "notification_deliveries",
  ANALYTICS: "analytics",
  MODEL_PREDICTIONS: "model_predictions",
} as const;

const MONGODB_URI = process.env.MONGODB_URI ?? "";

type Cache = { client: MongoClient };
let cached: Cache | null =
  (global as typeof globalThis & { _scoresMongo?: Cache })._scoresMongo ?? null;

async function getClient(): Promise<MongoClient> {
  if (cached?.client) return cached.client;
  if (!MONGODB_URI) throw new Error("MONGODB_URI env var is not set");

  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 8,
    serverSelectionTimeoutMS: 10_000,
  });
  await client.connect();
  cached = { client };
  (global as typeof globalThis & { _scoresMongo?: Cache })._scoresMongo = cached;
  return client;
}

export async function getScoresDb(): Promise<Db> {
  const client = await getClient();
  return client.db(SCORES_DB_NAME);
}
