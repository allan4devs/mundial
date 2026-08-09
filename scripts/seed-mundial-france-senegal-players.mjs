/**
 * Seed: preguntas de jugadores para France vs Senegal (Match #17)
 * Agrega preguntas player-especificas al live panel.
 * Este script es ADITIVO: no borra las preguntas existentes.
 *
 *   node --env-file=.env scripts/seed-mundial-france-senegal-players.mjs
 */

import { MongoClient, ObjectId } from "mongodb";

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "lva";
const COLLECTION = "mundial_stat_questions";

const MATCH_ID = "world-cup-2026-match-017";
const MATCH_NUMBER = 17;
const MATCH_LABEL = "France vs Senegal";

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
  // Estrellas principales
  makeQuestion(
    "¿Kylian Mbappé anota en el partido?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Kylian Mbappé anota 2 o más goles?",
    ["Sí", "No"],
    3
  ),

  makeQuestion(
    "¿Antoine Griezmann anota o da asistencia?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Ousmane Dembélé anota o da asistencia?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Bradley Barcola anota o da asistencia?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Marcus Thuram anota en el partido?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Sadio Mané anota en el partido?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Sadio Mané anota o da asistencia?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Nicolas Jackson anota en el partido?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Ismaïla Sarr anota o da asistencia?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Iliman Ndiaye anota o da asistencia?",
    ["Sí", "No"],
    2
  ),

  // Primer gol por jugador
  makeQuestion(
    "¿Quién marca el primer gol de France?",
    ["Kylian Mbappé", "Ousmane Dembélé", "Marcus Thuram", "Otro francés / France no anota"],
    3
  ),

  makeQuestion(
    "¿Quién marca el primer gol de Senegal?",
    ["Sadio Mané", "Nicolas Jackson", "Ismaïla Sarr", "Otro senegalés / Senegal no anota"],
    3
  ),

  // Tarjetas y duelos fisicos
  makeQuestion(
    "¿Aurélien Tchouaméni recibe tarjeta amarilla?",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿Pape Matar Sarr recibe tarjeta amarilla?",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿Kalidou Koulibaly recibe tarjeta amarilla?",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿Quién recibe la primera tarjeta amarilla?",
    ["France", "Senegal", "Sin tarjetas"]
  ),

  // Porteros y defensas
  makeQuestion(
    "¿Mike Maignan termina con arco en cero?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Édouard Mendy hace 4 o más atajadas?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Kalidou Koulibaly anota de cabeza?",
    ["Sí", "No"],
    3
  ),

  // Partido y momentos especiales
  makeQuestion(
    "¿France gana ambos tiempos?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿France tiene 60% o más de posesión?",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿Senegal gana 4 o más córners?",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿El partido llega empatado al minuto 60?",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿Hay gol antes del minuto 30?",
    ["Sí", "No"]
  ),

  makeQuestion(
    "¿Algún suplente anota o da asistencia?",
    ["Sí", "No"],
    2
  ),

  makeQuestion(
    "¿Quién tiene más remates al arco?",
    ["France", "Senegal", "Empate"],
    2
  ),
];

async function seed() {
  if (!URI) {
    console.error("MONGODB_URI no está definido en las variables de entorno.");
    process.exit(1);
  }

  const client = new MongoClient(URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);

    await col.createIndex({ id: 1 }, { unique: true });
    await col.createIndex({ matchId: 1 });

    const existingTexts = await col
      .find({ matchId: MATCH_ID }, { projection: { text: 1 } })
      .toArray()
      .then((docs) => new Set(docs.map((d) => d.text)));

    const toInsert = QUESTIONS.filter((q) => !existingTexts.has(q.text));

    if (toInsert.length === 0) {
      console.log(`Todas las preguntas de France vs Senegal ya existen para ${MATCH_LABEL}. Nada que insertar.`);
      return;
    }

    const result = await col.insertMany(toInsert);
    console.log(`${result.insertedCount} preguntas insertadas para ${MATCH_LABEL} (${MATCH_ID})`);
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
  console.error("Error en seed:", err);
  process.exit(1);
});
