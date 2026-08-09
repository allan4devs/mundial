/**
 * Seed: ≥10 preguntas estilo prop-bet para partidos 17-72 (fase de grupos restante)
 *
 * node --env-file=.env scripts/seed-mundial-remaining-groups.mjs
 * o bien:
 * npx dotenv -e .env -- node scripts/seed-mundial-remaining-groups.mjs
 */

import { MongoClient, ObjectId } from "mongodb";

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "lva";
const COLLECTION = "mundial_stat_questions";

function matchId(n) {
  return `world-cup-2026-match-${String(n).padStart(3, "0")}`;
}

function q(matchId, matchNumber, matchLabel, text, options, pointValue = 1) {
  const now = new Date();
  return {
    id: new ObjectId().toString(),
    matchId,
    matchNumber,
    matchLabel,
    text,
    options: options.map((label, i) => ({ id: `opt_${i}`, label })),
    correctOptionId: null,
    pointValue,
    resolvedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

/** Genera las 12 preguntas base + extras opcionales para cualquier partido. */
function makeQuestions(num, home, away, extras = []) {
  const mid = matchId(num);
  const label = `${home} vs ${away}`;
  const make = (text, options, pv = 1) => q(mid, num, label, text, options, pv);

  return [
    make(`¿Quién gana el partido?`, [home, "Empate", away]),
    make(`¿Ambos equipos anotan? (BTTS)`, ["Sí", "No"]),
    make(`¿Más de 2.5 goles en el partido? (Over/Under)`, ["Sí, más de 2.5", "No, 2 o menos"]),
    make(`¿Quién anota el primer gol?`, [home, away, "Sin goles"]),
    make(`¿Quién va ganando al descanso (min 45)?`, [home, "Empate", away]),
    make(`¿${home} gana sin recibir gol? (Clean Sheet)`, ["Sí", "No"]),
    make(`¿Habrá expulsado (tarjeta roja) en el partido?`, ["Sí", "No"]),
    make(`¿Cuántas tarjetas amarillas en total?`, ["0-2", "3-4", "5 o más"]),
    make(`¿Habrá penalti en el partido?`, ["Sí", "No"]),
    make(`¿El VAR cambia alguna decisión clave (gol/penalti/expulsión)?`, ["Sí", "No"]),
    make(`¿Habrá gol después del minuto 75?`, ["Sí", "No"]),
    make(`¿Habrá gol de cabeza en el partido?`, ["Sí", "No"]),
    ...extras.map(({ text, options, pv }) => make(text, options, pv ?? 2)),
  ];
}

const MATCHES = [
  // ── Fecha 3 · 16 Jun ──────────────────────────────────────────────────────
  {
    num: 17, home: "France", away: "Senegal",
    extras: [
      { text: "¿Kylian Mbappé anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Antoine Griezmann anota o da asistencia?", options: ["Sí", "No"] },
      { text: "¿Sadio Mané anota en el partido?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 18, home: "Iraq", away: "Norway",
    extras: [
      { text: "¿Erling Haaland anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Erling Haaland anota más de 1 gol?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 19, home: "Argentina", away: "Algeria",
    extras: [
      { text: "¿Lionel Messi anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Lionel Messi anota o da asistencia?", options: ["Sí", "No"] },
      { text: "¿Lautaro Martínez anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Riyad Mahrez anota o da asistencia?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 20, home: "Austria", away: "Jordan",
    extras: [
      { text: "¿Austria gana con más de 1 gol de diferencia? (Austria -1.5)", options: ["Sí", "No"] },
      { text: "¿Marcel Sabitzer anota o da asistencia?", options: ["Sí", "No"] },
    ],
  },

  // ── Fecha 3 · 17 Jun ──────────────────────────────────────────────────────
  {
    num: 21, home: "Ghana", away: "Panama",
    extras: [
      { text: "¿Cuántos goles en total?", options: ["0-1", "2-3", "4 o más"] },
    ],
  },
  {
    num: 22, home: "England", away: "Croatia",
    extras: [
      { text: "¿Harry Kane anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Jude Bellingham anota o da asistencia?", options: ["Sí", "No"] },
      { text: "¿Luka Modrić da asistencia en el partido?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 23, home: "Portugal", away: "Congo DR",
    extras: [
      { text: "¿Cristiano Ronaldo anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Cristiano Ronaldo anota más de 1 gol?", options: ["Sí", "No"] },
      { text: "¿Portugal gana con más de 1 gol de diferencia?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 24, home: "Uzbekistan", away: "Colombia",
    extras: [
      { text: "¿Luis Díaz anota en el partido?", options: ["Sí", "No"] },
      { text: "¿James Rodríguez da asistencia?", options: ["Sí", "No"] },
    ],
  },

  // ── Fecha 4 · 18 Jun ──────────────────────────────────────────────────────
  {
    num: 25, home: "Czechia", away: "South Africa",
    extras: [
      { text: "¿Cuántos goles anota Czechia?", options: ["0", "1", "2 o más"] },
    ],
  },
  {
    num: 26, home: "Switzerland", away: "Bosnia and Herzegovina",
    extras: [
      { text: "¿Granit Xhaka recibe tarjeta amarilla?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 27, home: "Canada", away: "Qatar",
    extras: [
      { text: "¿Alphonso Davies anota o da asistencia?", options: ["Sí", "No"] },
      { text: "¿Canada gana sin recibir gol?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 28, home: "Mexico", away: "Korea Republic",
    extras: [
      { text: "¿Hirving Lozano anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Mexico gana con más de 1 gol de diferencia?", options: ["Sí", "No"] },
    ],
  },

  // ── Fecha 4 · 19 Jun ──────────────────────────────────────────────────────
  {
    num: 29, home: "Brazil", away: "Haiti",
    extras: [
      { text: "¿Vinicius Jr. anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Brazil gana con más de 1 gol de diferencia?", options: ["Sí", "No"] },
      { text: "¿Brazil gana sin recibir gol?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 30, home: "Scotland", away: "Morocco",
    extras: [
      { text: "¿Hakim Ziyech anota o da asistencia?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 31, home: "Turkiye", away: "Paraguay",
    extras: [
      { text: "¿Arda Güler anota o da asistencia?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 32, home: "USA", away: "Australia",
    extras: [
      { text: "¿Christian Pulisic anota en el partido?", options: ["Sí", "No"] },
      { text: "¿USA gana sin recibir gol?", options: ["Sí", "No"] },
    ],
  },

  // ── Fecha 4 · 20 Jun ──────────────────────────────────────────────────────
  {
    num: 33, home: "Germany", away: "Cote d'Ivoire",
    extras: [
      { text: "¿Florian Wirtz anota o da asistencia?", options: ["Sí", "No"] },
      { text: "¿Kai Havertz anota en el partido?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 34, home: "Ecuador", away: "Curacao",
    extras: [
      { text: "¿Ecuador gana con más de 1 gol de diferencia?", options: ["Sí", "No"] },
      { text: "¿Ecuador gana sin recibir gol?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 35, home: "Netherlands", away: "Sweden",
    extras: [
      { text: "¿Cody Gakpo anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Victor Gyokeres anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Alexander Isak anota en el partido?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 36, home: "Tunisia", away: "Japan",
    extras: [
      { text: "¿Kaoru Mitoma anota o da asistencia?", options: ["Sí", "No"] },
    ],
  },

  // ── Fecha 4 · 21 Jun ──────────────────────────────────────────────────────
  {
    num: 37, home: "Uruguay", away: "Cabo Verde",
    extras: [
      { text: "¿Darwin Núñez anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Uruguay gana sin recibir gol?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 38, home: "Spain", away: "Saudi Arabia",
    extras: [
      { text: "¿Pedri anota o da asistencia?", options: ["Sí", "No"] },
      { text: "¿Álvaro Morata anota en el partido?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 39, home: "Belgium", away: "IR Iran",
    extras: [
      { text: "¿Kevin De Bruyne da asistencia?", options: ["Sí", "No"] },
      { text: "¿Lois Openda anota en el partido?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 40, home: "New Zealand", away: "Egypt",
    extras: [
      { text: "¿Mohamed Salah anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Mohamed Salah anota o da asistencia?", options: ["Sí", "No"] },
    ],
  },

  // ── Fecha 4 · 22 Jun ──────────────────────────────────────────────────────
  {
    num: 41, home: "Norway", away: "Senegal",
    extras: [
      { text: "¿Erling Haaland anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Sadio Mané anota en el partido?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 42, home: "France", away: "Iraq",
    extras: [
      { text: "¿Kylian Mbappé anota en el partido?", options: ["Sí", "No"] },
      { text: "¿France gana sin recibir gol?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 43, home: "Argentina", away: "Austria",
    extras: [
      { text: "¿Lionel Messi anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Lautaro Martínez anota en el partido?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 44, home: "Jordan", away: "Algeria",
    extras: [
      { text: "¿Riyad Mahrez anota o da asistencia?", options: ["Sí", "No"] },
    ],
  },

  // ── Fecha 4 · 23 Jun ──────────────────────────────────────────────────────
  {
    num: 45, home: "England", away: "Ghana",
    extras: [
      { text: "¿Harry Kane anota en el partido?", options: ["Sí", "No"] },
      { text: "¿England gana sin recibir gol?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 46, home: "Panama", away: "Croatia",
    extras: [
      { text: "¿Luka Modrić da asistencia o anota?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 47, home: "Portugal", away: "Uzbekistan",
    extras: [
      { text: "¿Cristiano Ronaldo anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Portugal gana con más de 1 gol de diferencia?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 48, home: "Colombia", away: "Congo DR",
    extras: [
      { text: "¿Luis Díaz anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Colombia gana sin recibir gol?", options: ["Sí", "No"] },
    ],
  },

  // ── Jornada final grupos · 24 Jun ─────────────────────────────────────────
  {
    num: 49, home: "Scotland", away: "Brazil",
    extras: [
      { text: "¿Vinicius Jr. anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Brazil gana sin recibir gol?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 50, home: "Morocco", away: "Haiti",
    extras: [
      { text: "¿Hakim Ziyech anota o da asistencia?", options: ["Sí", "No"] },
      { text: "¿Morocco gana sin recibir gol?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 51, home: "Switzerland", away: "Canada",
    extras: [
      { text: "¿Alphonso Davies anota o da asistencia?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 52, home: "Bosnia and Herzegovina", away: "Qatar",
    extras: [
      { text: "¿Bosnia and Herzegovina gana sin recibir gol?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 53, home: "Czechia", away: "Mexico",
    extras: [
      { text: "¿Mexico clasifica con este resultado?", options: ["Sí", "No"] },
      { text: "¿Hirving Lozano anota en el partido?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 54, home: "South Africa", away: "Korea Republic",
    extras: [
      { text: "¿Cuántos goles en total?", options: ["0-1", "2-3", "4 o más"] },
    ],
  },

  // ── Jornada final grupos · 25 Jun ─────────────────────────────────────────
  {
    num: 55, home: "Curacao", away: "Cote d'Ivoire",
    extras: [
      { text: "¿Cote d'Ivoire gana sin recibir gol?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 56, home: "Ecuador", away: "Germany",
    extras: [
      { text: "¿Florian Wirtz anota o da asistencia?", options: ["Sí", "No"] },
      { text: "¿Kai Havertz anota en el partido?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 57, home: "Japan", away: "Sweden",
    extras: [
      { text: "¿Victor Gyokeres anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Kaoru Mitoma anota en el partido?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 58, home: "Tunisia", away: "Netherlands",
    extras: [
      { text: "¿Cody Gakpo anota en el partido?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 59, home: "Turkiye", away: "USA",
    extras: [
      { text: "¿Christian Pulisic anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Arda Güler anota o da asistencia?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 60, home: "Paraguay", away: "Australia",
    extras: [
      { text: "¿Cuántos goles en total?", options: ["0-1", "2-3", "4 o más"] },
    ],
  },

  // ── Jornada final grupos · 26 Jun ─────────────────────────────────────────
  {
    num: 61, home: "Norway", away: "France",
    extras: [
      { text: "¿Erling Haaland anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Kylian Mbappé anota en el partido?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 62, home: "Senegal", away: "Iraq",
    extras: [
      { text: "¿Sadio Mané anota en el partido?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 63, home: "Egypt", away: "IR Iran",
    extras: [
      { text: "¿Mohamed Salah anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Mohamed Salah anota o da asistencia?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 64, home: "New Zealand", away: "Belgium",
    extras: [
      { text: "¿Kevin De Bruyne da asistencia?", options: ["Sí", "No"] },
      { text: "¿Belgium gana sin recibir gol?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 65, home: "Cabo Verde", away: "Saudi Arabia",
    extras: [
      { text: "¿Cuántos goles en total?", options: ["0-1", "2-3", "4 o más"] },
    ],
  },
  {
    num: 66, home: "Uruguay", away: "Spain",
    extras: [
      { text: "¿Darwin Núñez anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Pedri anota o da asistencia?", options: ["Sí", "No"] },
    ],
  },

  // ── Jornada final grupos · 27 Jun ─────────────────────────────────────────
  {
    num: 67, home: "Panama", away: "England",
    extras: [
      { text: "¿Harry Kane anota en el partido?", options: ["Sí", "No"] },
      { text: "¿England gana sin recibir gol?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 68, home: "Croatia", away: "Ghana",
    extras: [
      { text: "¿Luka Modrić da asistencia o anota?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 69, home: "Algeria", away: "Austria",
    extras: [
      { text: "¿Riyad Mahrez anota o da asistencia?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 70, home: "Jordan", away: "Argentina",
    extras: [
      { text: "¿Lionel Messi anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Argentina gana con más de 1 gol de diferencia?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 71, home: "Colombia", away: "Portugal",
    extras: [
      { text: "¿Cristiano Ronaldo anota en el partido?", options: ["Sí", "No"] },
      { text: "¿Luis Díaz anota en el partido?", options: ["Sí", "No"] },
    ],
  },
  {
    num: 72, home: "Congo DR", away: "Uzbekistan",
    extras: [
      { text: "¿Cuántos goles en total?", options: ["0-1", "2-3", "4 o más"] },
    ],
  },
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

    let totalInserted = 0;
    let totalSkipped = 0;

    for (const m of MATCHES) {
      const mid = matchId(m.num);
      const label = `${m.home} vs ${m.away}`;

      const existing = await col.countDocuments({ matchId: mid });
      if (existing > 0) {
        console.log(`⚠️  Partido ${m.num} (${label}): ya tiene ${existing} pregunta(s). Saltando.`);
        totalSkipped++;
        continue;
      }

      const questions = makeQuestions(m.num, m.home, m.away, m.extras);
      const result = await col.insertMany(questions);
      console.log(`✅  Partido ${m.num} (${label}): ${result.insertedCount} preguntas insertadas`);
      totalInserted += result.insertedCount;
    }

    console.log(`\n📊  Resumen: ${totalInserted} preguntas insertadas · ${totalSkipped} partidos ya existentes omitidos`);
  } finally {
    await client.close();
  }
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
