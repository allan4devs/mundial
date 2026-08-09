/**
 * Seed: preguntas de jugadores para Belgium vs Egypt (Match #16)
 * Agrega preguntas player-específicas al live panel (quien gol, amarilla, etc.)
 * Este script es ADITIVO — no borra las preguntas existentes.
 *
 *   node --env-file=.env scripts/seed-mundial-belgium-egypt-players.mjs
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

// ── Jugadores Bélgica ──────────────────────────────────────────────────────────
// Portero: Koen Casteels
// Defensas: Thomas Meunier, Wout Faes, Jan Vertonghen, Arthur Theate
// Mediocampistas: Axel Witsel, Kevin De Bruyne, Leandro Trossard
// Delanteros: Jeremy Doku, Lois Openda, Romelu Lukaku

// ── Jugadores Egipto ───────────────────────────────────────────────────────────
// Portero: Ahmed El-Shenawy
// Defensas: Ahmed Hegazi, Omar El-Abd, Akram Tawfik, Mahmoud Alaa
// Mediocampistas: Mohamed El Nenny, Tarek Hamed, Amr El Sulaya
// Delanteros: Trézéguet, Mohamed Salah, Omar Marmoush, Mostafa Mohamed

const QUESTIONS = [
  // ── ¿Quién marca? (por jugador) ───────────────────────────────────────────

  makeQuestion(
    "¿Romelu Lukaku anota en el partido?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Jeremy Doku anota o da asistencia?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Leandro Trossard anota o da asistencia?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Mostafa Mohamed anota en el partido?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Trézéguet anota o da asistencia?",
    ["Sí", "No"],
    2
  ),

  // ── ¿Quién marca el primer gol? (pick jugador) ────────────────────────────

  makeQuestion(
    "¿Quién marca el primer gol? (jugadores Belgium)",
    ["Romelu Lukaku", "Lois Openda", "Kevin De Bruyne", "Jeremy Doku", "Leandro Trossard", "Otro belga"],
    3
  ),

  makeQuestion(
    "¿Quién marca el primer gol? (jugadores Egypt)",
    ["Mohamed Salah", "Omar Marmoush", "Mostafa Mohamed", "Trézéguet", "Otro egipcio"],
    3
  ),

  // ── Tarjetas amarillas (por jugador) ─────────────────────────────────────

  makeQuestion(
    "¿Quién recibe la primera tarjeta amarilla del partido?",
    ["Kevin De Bruyne", "Axel Witsel", "Tarek Hamed", "Mohamed El Nenny", "Otro jugador"]
  ),

  makeQuestion(
    "¿Romelu Lukaku recibe tarjeta amarilla?",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿Mohamed Salah recibe tarjeta amarilla?",
    ["Sí", "No"]
  ),

  // ── Porteros y defensas ───────────────────────────────────────────────────

  makeQuestion(
    "¿Koen Casteels (portero Belgium) hace alguna parada clave?",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿Ahmed Hegazi (defensa Egypt) anota de cabeza?",
    ["Sí", "No"],
    2
  ),

  // ── Duelo individual ──────────────────────────────────────────────────────

  makeQuestion(
    "¿Kevin De Bruyne o Mohamed Salah — quién tiene más participaciones en gol?",
    ["Kevin De Bruyne", "Mohamed Salah", "Empate / Ninguno"],
    2
  ),

  makeQuestion(
    "¿Romelu Lukaku o Mostafa Mohamed — quién anota primero?",
    ["Romelu Lukaku", "Mostafa Mohamed", "Ninguno de los dos"],
    2
  ),

  // ── Sustituciones con impacto ─────────────────────────────────────────────

  makeQuestion(
    "¿Algún jugador que entra como sustituto anota o da asistencia?",
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

    // Sólo insertar preguntas cuyo texto exacto no exista ya en este partido
    const existingTexts = await col
      .find({ matchId: MATCH_ID }, { projection: { text: 1 } })
      .toArray()
      .then((docs) => new Set(docs.map((d) => d.text)));

    const toInsert = QUESTIONS.filter((q) => !existingTexts.has(q.text));

    if (toInsert.length === 0) {
      console.log(`⚠️  Todas las preguntas de jugadores ya existen para ${MATCH_LABEL}. Nada que insertar.`);
      return;
    }

    const result = await col.insertMany(toInsert);
    console.log(`✅  ${result.insertedCount} preguntas de jugadores insertadas para ${MATCH_LABEL} (${MATCH_ID})`);
    toInsert.forEach((q, i) => {
      console.log(`   ${i + 1}. [${q.pointValue}pt] ${q.text}`);
    });

    const skipped = QUESTIONS.length - toInsert.length;
    if (skipped > 0) {
      console.log(`   (${skipped} omitidas por ya existir)`);
    }
  } finally {
    await client.close();
  }
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
