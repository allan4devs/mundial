/**
 * Seed: 20 preguntas estilo prop-bet para Sweden vs Tunisia (Match #12)
 * Grupo F · Estadio Monterrey · 2026-06-14T20:00:00-06:00
 *
 * Correr con Node 20+:
 *   node --env-file=.env scripts/seed-mundial-sweden-tunisia.mjs
 *
 * O con dotenv-cli:
 *   npx dotenv -e .env -- node scripts/seed-mundial-sweden-tunisia.mjs
 */

import { MongoClient, ObjectId } from "mongodb";

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "lva";
const COLLECTION = "mundial_stat_questions";

const MATCH_ID = "world-cup-2026-match-012";
const MATCH_NUMBER = 12;
const MATCH_LABEL = "Sweden vs Tunisia";

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
    "¿Quién gana el partido?",
    ["Sweden", "Empate", "Tunisia"]
  ),

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
    ["Sweden", "Tunisia", "Sin goles"]
  ),

  makeQuestion(
    "¿Quién va ganando al descanso (min 45)?",
    ["Sweden", "Empate", "Tunisia"]
  ),

  makeQuestion(
    "¿Sweden gana sin recibir gol? (Clean Sheet)",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿Sweden gana con más de 1 gol de diferencia? (Sweden -1.5)",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿Cuántos goles marca Sweden en total?",
    ["0", "1", "2", "3 o más"]
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
    ["Sweden", "Tunisia"]
  ),

  makeQuestion(
    "¿Hannibal Mejbri (Tunisia) recibe tarjeta amarilla?",
    ["Sí", "No"],
    2
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

  // ── Jugadores Sweden ──────────────────────────────────────────────────────
  makeQuestion(
    "¿Alexander Isak anota en el partido?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Victor Gyokeres anota en el partido?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Quién anota primero entre los delanteros suecos?",
    ["Alexander Isak", "Victor Gyokeres", "Dejan Kulusevski", "Otro / Ninguno"],
    3
  ),

  // ── Jugadores Tunisia ─────────────────────────────────────────────────────
  makeQuestion(
    "¿Wahbi Khazri anota o da asistencia en el partido?",
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

    // Crear índices necesarios (idempotente)
    await col.createIndex({ id: 1 }, { unique: true });
    await col.createIndex({ matchId: 1 });

    // Verificar si ya existen preguntas para este partido
    const existing = await col.countDocuments({ matchId: MATCH_ID });
    if (existing > 0) {
      console.log(`⚠️  Ya existen ${existing} pregunta(s) para ${MATCH_LABEL}. Abortando seed para evitar duplicados.`);
      console.log("   Eliminá las existentes desde el panel admin o borrá la colección manualmente si querés re-seed.");
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
