/**
 * Seed: 20 preguntas estilo prop-bet para Belgium vs Egypt (Match #16)
 * Grupo G · Seattle Stadium · 2026-06-15T13:00:00-06:00
 *
 * Correr con Node 20+:
 *   node --env-file=.env scripts/seed-mundial-belgium-egypt.mjs
 *
 * O con dotenv-cli:
 *   npx dotenv -e .env -- node scripts/seed-mundial-belgium-egypt.mjs
 */

import { MongoClient, ObjectId } from "mongodb";

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "lva";
const COLLECTION = "mundial_stat_questions";

const MATCH_ID = "world-cup-2026-match-016";
const MATCH_NUMBER = 16;
const MATCH_LABEL = "Belgium vs Egypt";

function makeQuestion(text, options, pointValue = 1) {
  const now = new Date();
  return {
    id: new ObjectId().toString(),
    matchId: MATCH_ID,
    matchNumber: MATCH_NUMBER,
    matchLabel: MATCH_LABEL,
    text,
    options: options.map((label, i) => ({ id: `opt_${i}`, label })),
    correctOptionId: null,
    pointValue,
    resolvedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

const QUESTIONS = [
  // ── Resultado del partido ──────────────────────────────────────────────────
  makeQuestion(
    "¿Ambos equipos anotan? (BTTS)",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿Más de 2.5 goles en el partido? (Over/Under)",
    ["Sí, más de 2.5", "No, 2 o menos"]
  ),

  makeQuestion(
    "¿Quién anota el primer gol?",
    ["Belgium", "Egypt", "Sin goles"]
  ),

  makeQuestion(
    "¿Quién va ganando al descanso (min 45)?",
    ["Belgium", "Empate", "Egypt"]
  ),

  makeQuestion(
    "¿Belgium gana sin recibir gol? (Clean Sheet)",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿Belgium gana con más de 1 gol de diferencia? (Belgium -1.5)",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿Cuántos goles marca Egypt en total?",
    ["0", "1", "2 o más"]
  ),

  // ── Tarjetas ───────────────────────────────────────────────────────────────
  makeQuestion(
    "¿Habrá expulsado (tarjeta roja) en el partido?",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿Cuántas tarjetas amarillas en total?",
    ["0-2", "3-4", "5 o más"]
  ),

  makeQuestion(
    "¿Qué equipo recibe la primera tarjeta amarilla?",
    ["Belgium", "Egypt"]
  ),

  // ── Penaltis y VAR ─────────────────────────────────────────────────────────
  makeQuestion(
    "¿Habrá penalti en el partido?",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿El VAR cambia alguna decisión clave (gol/penalti/expulsión)?",
    ["Sí", "No"]
  ),

  // ── Jugadores Egypt ───────────────────────────────────────────────────────
  makeQuestion(
    "¿Mohamed Salah anota en el partido?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Mohamed Salah anota o da asistencia?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Omar Marmoush anota en el partido?",
    ["Sí", "No"],
    2
  ),

  // ── Jugadores Belgium ─────────────────────────────────────────────────────
  makeQuestion(
    "¿Kevin De Bruyne da asistencia en el partido?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Lois Openda anota en el partido?",
    ["Sí", "No"],
    2
  ),

  // ── Momentos del partido ──────────────────────────────────────────────────
  makeQuestion(
    "¿Habrá gol después del minuto 75?",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿Habrá gol de cabeza en el partido?",
    ["Sí", "No"]
  ),
];

async function seed() {
  if (!URI) {
    console.error("❌  MONGODB_URI no está definido en las variables de entorno.");
    process.exit(1);
  }

  const client = new MongoClient(URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);

    await col.createIndex({ id: 1 }, { unique: true });
    await col.createIndex({ matchId: 1 });

    const existing = await col.countDocuments({ matchId: MATCH_ID });
    if (existing > 0) {
      console.log(`⚠️  Ya existen ${existing} pregunta(s) para ${MATCH_LABEL}. Abortando seed para evitar duplicados.`);
      console.log("   Eliminá las existentes desde el panel admin si querés re-seed.");
      return;
    }

    const result = await col.insertMany(QUESTIONS);
    console.log(`✅  ${result.insertedCount} preguntas insertadas para ${MATCH_LABEL} (${MATCH_ID})`);
    QUESTIONS.forEach((q, i) => {
      console.log(`   ${i + 1}. [${q.pointValue}pt] ${q.text}`);
    });
  } finally {
    await client.close();
  }
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
