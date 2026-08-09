/**
 * Elimina la pregunta "¿Quién gana el partido?" de Belgium vs Egypt
 * ya que el resultado ya se apuesta en el marcador principal.
 *
 *   node --env-file=.env scripts/delete-quien-gana-question.mjs
 */

import { MongoClient } from "mongodb";

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "lva";
const COLLECTION = "mundial_stat_questions";
const MATCH_ID = "world-cup-2026-match-016";

async function run() {
  if (!URI) { console.error("❌  MONGODB_URI no definido."); process.exit(1); }
  const client = new MongoClient(URI);
  try {
    await client.connect();
    const col = client.db(DB_NAME).collection(COLLECTION);
    const result = await col.deleteMany({
      matchId: MATCH_ID,
      text: { $regex: /qui[eé]n gana el partido/i },
    });
    console.log(`✅  ${result.deletedCount} pregunta(s) eliminadas para ${MATCH_ID}`);
  } finally {
    await client.close();
  }
}

run().catch((err) => { console.error("❌", err); process.exit(1); });
