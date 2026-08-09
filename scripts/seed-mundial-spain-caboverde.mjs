/**
 * Seed: preguntas estilo prop-bet para Spain vs Cabo Verde (Match #14)
 * Grupo H · Atlanta Stadium · 2026-06-15T10:00:00-06:00
 *
 *   node --env-file=.env scripts/seed-mundial-spain-caboverde.mjs
 */

import { MongoClient, ObjectId } from "mongodb";

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "lva";
const COLLECTION = "mundial_stat_questions";

const MATCH_ID = "world-cup-2026-match-014";
const MATCH_NUMBER = 14;
const MATCH_LABEL = "Spain vs Cabo Verde";

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
    ["Spain", "Cabo Verde", "Sin goles"]
  ),

  makeQuestion(
    "¿Quién va ganando al descanso (min 45)?",
    ["Spain", "Empate", "Cabo Verde"]
  ),

  makeQuestion(
    "¿Spain gana sin recibir gol? (Clean Sheet)",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿Spain gana con más de 2 goles de diferencia? (Spain -2.5)",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿Cuántos goles marca Spain en total?",
    ["1", "2", "3 o más"]
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

  // ── Penaltis y VAR ─────────────────────────────────────────────────────────
  makeQuestion(
    "¿Habrá penalti en el partido?",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿El VAR cambia alguna decisión clave (gol/penalti/expulsión)?",
    ["Sí", "No"]
  ),

  // ── Jugadores Spain ───────────────────────────────────────────────────────
  makeQuestion(
    "¿Lamine Yamal anota en el partido?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Lamine Yamal anota o da asistencia?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Pedri anota o da asistencia en el partido?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Nico Williams anota en el partido?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Dani Olmo anota o da asistencia?",
    ["Sí", "No"],
    2
  ),

  // ── Momentos del partido ──────────────────────────────────────────────────
  makeQuestion(
    "¿Habrá gol antes del minuto 30?",
    ["Sí", "No"]
  ),

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
