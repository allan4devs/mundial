import fs from "node:fs";
import { createHash } from "node:crypto";
import { MongoClient } from "mongodb";

const MATCHES_COLLECTION = "mundial_matches";
const ROSTERS_COLLECTION = "mundial_rosters";
const QUESTIONS_COLLECTION = "mundial_stat_questions";
const TARGET_COUNT = 50;

function loadEnv() {
  if (!fs.existsSync(".env")) return;
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function slug(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function questionId(matchId, text) {
  const hash = createHash("sha1").update(`${matchId}:${text}`).digest("hex").slice(0, 8);
  return `live-${matchId}-${slug(text)}-${hash}`;
}

function optionLabels(labels) {
  return labels.map((label, index) => ({ id: `opt_${index}`, label }));
}

function q(match, text, labels, pointValue = 1) {
  return {
    id: questionId(match.id, text),
    matchId: match.id,
    matchNumber: match.number,
    matchLabel: `${match.homeTeam} vs ${match.awayTeam}`,
    text,
    options: optionLabels(labels),
    correctOptionId: null,
    pointValue,
    resolvedAt: null,
  };
}

function byPosition(roster, patterns) {
  return roster.filter((player) => {
    const raw = `${player.pos ?? ""} ${player.position ?? ""}`.toLowerCase();
    return patterns.some((pattern) => raw.includes(pattern));
  });
}

function topNames(roster, fallback, count) {
  const picked = roster.filter((player) => player.name).slice(0, count).map((player) => player.name);
  while (picked.length < count) picked.push(fallback[picked.length % fallback.length]);
  return picked;
}

function buildQuestions(match, homeRoster, awayRoster) {
  const home = match.homeTeam;
  const away = match.awayTeam;
  const homeAttack = topNames([...byPosition(homeRoster, ["forward", "fw", "mid"]), ...homeRoster], [home, "Otro"], 4);
  const awayAttack = topNames([...byPosition(awayRoster, ["forward", "fw", "mid"]), ...awayRoster], [away, "Otro"], 4);
  const homeGk = topNames(byPosition(homeRoster, ["goalkeeper", "gk"]), ["Portero local"], 1)[0];
  const awayGk = topNames(byPosition(awayRoster, ["goalkeeper", "gk"]), ["Portero visitante"], 1)[0];
  const starOptions = [...homeAttack.slice(0, 2), ...awayAttack.slice(0, 2)];

  const base = [
    q(match, "En los proximos 20 segundos, algun portero hace una atajada?", ["Si", "No"], 2),
    q(match, `En los proximos 20 segundos, ${homeGk} la tapa?`, ["Si", "No"], 3),
    q(match, `En los proximos 20 segundos, ${awayGk} la tapa?`, ["Si", "No"], 3),
    q(match, "En el proximo minuto hay remate a marco?", ["Si", "No"], 2),
    q(match, `En el proximo minuto remata ${home}?`, ["Si", "No"], 1),
    q(match, `En el proximo minuto remata ${away}?`, ["Si", "No"], 1),
    q(match, "En los proximos 3 minutos hay corner?", ["Si", "No"], 1),
    q(match, `Proximo corner`, [home, away, "No hay"], 2),
    q(match, "En los proximos 5 minutos hay gol?", ["Si", "No"], 3),
    q(match, `Proximo gol`, [home, away, "No hay gol"], 2),
    q(match, "Proximo evento importante", ["Gol", "Tarjeta", "VAR", "Nada"], 2),
    q(match, "El VAR actua antes del proximo paron largo?", ["Si", "No"], 3),
    q(match, "El VAR cambia una decision?", ["Si", "No"], 4),
    q(match, "Sale amarilla en los proximos 5 minutos?", ["Si", "No"], 2),
    q(match, "Proxima amarilla", [home, away, "No hay"], 2),
    q(match, "Sale roja antes del final?", ["Si", "No"], 4),
    q(match, "Hay penal en los proximos 10 minutos?", ["Si", "No"], 4),
    q(match, "Proximo tiro libre peligroso", [home, away, "Ninguno"], 1),
    q(match, "Proximo fuera de juego", [home, away, "Ninguno"], 1),
    q(match, "Proxima falta dura", [home, away, "No hay"], 1),
    q(match, "Quien domina los proximos 5 minutos?", [home, away, "Parejo"], 1),
    q(match, "Proxima posesion larga termina en remate?", ["Si", "No"], 2),
    q(match, "Proximo ataque termina en centro al area?", ["Si", "No"], 1),
    q(match, "Proximo ataque claro", [home, away, "Ninguno"], 1),
    q(match, "Hay gol antes del minuto 30?", ["Si", "No"], 2),
    q(match, "Hay gol antes del descanso?", ["Si", "No"], 2),
    q(match, "Hay gol despues del minuto 75?", ["Si", "No"], 2),
    q(match, "Hay gol de cabeza?", ["Si", "No"], 3),
    q(match, "Hay gol fuera del area?", ["Si", "No"], 4),
    q(match, "Hay asistencia en el proximo gol?", ["Si", "No", "No hay gol"], 2),
    q(match, "El proximo gol es de jugada?", ["Si", "No, balon parado", "No hay gol"], 2),
    q(match, "El proximo gol llega tras centro?", ["Si", "No", "No hay gol"], 2),
    q(match, "Proxima revision arbitral", ["VAR", "Tarjeta", "Penal", "Ninguna"], 2),
    q(match, "Proxima sustitucion", [home, away, "No hay"], 1),
    q(match, "Proximo equipo con 2 tiros seguidos", [home, away, "Ninguno"], 1),
    q(match, "Proximo equipo que obliga atajada", [home, away, "Ninguno"], 2),
    q(match, "Proximo equipo que despeja en linea", [home, away, "Ninguno"], 3),
    q(match, "Proxima pelota al palo", [home, away, "No hay"], 4),
    q(match, "Proximo contraataque peligroso", [home, away, "Ninguno"], 2),
    q(match, "Proximo jugador en rematar", [...starOptions.slice(0, 3), "Otro"], 3),
    q(match, "Proximo jugador en anotar", [...starOptions.slice(0, 3), "Otro / nadie"], 4),
    q(match, `Anota ${homeAttack[0]}?`, ["Si", "No"], 3),
    q(match, `Anota ${homeAttack[1]}?`, ["Si", "No"], 3),
    q(match, `Anota ${awayAttack[0]}?`, ["Si", "No"], 3),
    q(match, `Anota ${awayAttack[1]}?`, ["Si", "No"], 3),
    q(match, `Amarilla para ${homeAttack[0]}?`, ["Si", "No"], 3),
    q(match, `Amarilla para ${awayAttack[0]}?`, ["Si", "No"], 3),
    q(match, `Mas remates en los proximos 10 minutos`, [home, away, "Empate"], 2),
    q(match, `Mas corners en los proximos 10 minutos`, [home, away, "Empate"], 2),
    q(match, `Quien anota si hay gol en los proximos 10 minutos?`, [homeAttack[0], awayAttack[0], "Otro", "Nadie"], 4),
    q(match, "Hay celebracion anulada por VAR?", ["Si", "No"], 4),
    q(match, "El arquero sale a cortar un centro peligroso?", ["Si", "No"], 2),
    q(match, "Hay tiro libre directo a marco?", ["Si", "No"], 3),
    q(match, "Hay penal tapado?", ["Si", "No"], 5),
    q(match, "Proximo equipo en perder la pelota saliendo", [home, away, "Ninguno"], 1),
    q(match, "Proximo duelo fisico termina en falta?", ["Si", "No"], 1),
  ];

  const unique = new Map();
  for (const question of base) unique.set(question.id, question);
  return [...unique.values()];
}

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "laviejadventures";
  if (!uri) throw new Error("MONGODB_URI missing");

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const match = await db.collection(MATCHES_COLLECTION).findOne(
    { liveStatus: { $in: ["live", "halftime"] } },
    { projection: { _id: 0, id: 1, number: 1, homeTeam: 1, awayTeam: 1 } }
  );
  if (!match) throw new Error("No live match found.");

  const [homeRoster, awayRoster, existing] = await Promise.all([
    db.collection(ROSTERS_COLLECTION).find({ team: match.homeTeam, active: true }).sort({ squadNumber: 1, name: 1 }).toArray(),
    db.collection(ROSTERS_COLLECTION).find({ team: match.awayTeam, active: true }).sort({ squadNumber: 1, name: 1 }).toArray(),
    db.collection(QUESTIONS_COLLECTION).find({ matchId: match.id }, { projection: { id: 1 } }).toArray(),
  ]);

  const existingIds = new Set(existing.map((question) => question.id));
  const now = new Date();
  const candidates = buildQuestions(match, homeRoster, awayRoster);
  const needed = Math.max(0, TARGET_COUNT - existing.length);
  const inserts = candidates
    .filter((question) => !existingIds.has(question.id))
    .slice(0, needed)
    .map((question) => ({ ...question, createdAt: now, updatedAt: now }));

  if (inserts.length) {
    await db.collection(QUESTIONS_COLLECTION).insertMany(inserts, { ordered: false });
  }

  console.log(JSON.stringify({
    dbName,
    match: `${match.homeTeam} vs ${match.awayTeam}`,
    existing: existing.length,
    inserted: inserts.length,
    final: existing.length + inserts.length,
    homeRoster: homeRoster.length,
    awayRoster: awayRoster.length,
  }, null, 2));

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
