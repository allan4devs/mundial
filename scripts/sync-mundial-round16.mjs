/**
 * Sync octavos de final (round16) fixtures to Mongo + refresh prediction labels/times.
 *
 *   node --env-file=.env scripts/sync-mundial-round16.mjs
 */

import { MongoClient } from "mongodb";

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "lva";

const ROUND16 = [
  {
    id: "world-cup-2026-match-089",
    number: 89,
    date: "2026-07-04",
    kickoffAt: "2026-07-04T14:00:00-06:00",
    homeSeed: "W74",
    awaySeed: "W77",
    homeTeam: "Brazil",
    awayTeam: "Norway",
  },
  {
    id: "world-cup-2026-match-090",
    number: 90,
    date: "2026-07-03",
    kickoffAt: "2026-07-03T15:00:00-06:00",
    homeSeed: "W75",
    awaySeed: "W78",
    homeTeam: "Paraguay",
    awayTeam: "France",
  },
  {
    id: "world-cup-2026-match-091",
    number: 91,
    date: "2026-07-03",
    kickoffAt: "2026-07-03T11:00:00-06:00",
    homeSeed: "W73",
    awaySeed: "W76",
    homeTeam: "Canada",
    awayTeam: "Morocco",
  },
  {
    id: "world-cup-2026-match-092",
    number: 92,
    date: "2026-07-04",
    kickoffAt: "2026-07-04T18:00:00-06:00",
    homeSeed: "W79",
    awaySeed: "W80",
    homeTeam: "Mexico",
    awayTeam: "England",
  },
  {
    id: "world-cup-2026-match-093",
    number: 93,
    date: "2026-07-06",
    kickoffAt: "2026-07-06T13:00:00-06:00",
    homeSeed: "W84",
    awaySeed: "W83",
    homeTeam: "Portugal",
    awayTeam: "Spain",
  },
  {
    id: "world-cup-2026-match-094",
    number: 94,
    date: "2026-07-06",
    kickoffAt: "2026-07-06T18:00:00-06:00",
    homeSeed: "W82",
    awaySeed: "W81",
    homeTeam: "USA",
    awayTeam: "Belgium",
  },
  {
    id: "world-cup-2026-match-095",
    number: 95,
    date: "2026-07-07",
    kickoffAt: "2026-07-07T10:00:00-06:00",
    homeSeed: "W86",
    awaySeed: "W88",
    homeTeam: "Argentina",
    awayTeam: "Egypt",
  },
  {
    id: "world-cup-2026-match-096",
    number: 96,
    date: "2026-07-07",
    kickoffAt: "2026-07-07T14:00:00-06:00",
    homeSeed: "W85",
    awaySeed: "W87",
    homeTeam: "Switzerland",
    awayTeam: "Colombia",
  },
];

const SHARED = {
  stage: "round16",
  stageLabel: "Octavos",
  venue: "Por confirmar",
  sortOrder: null,
};

function label(m) {
  return `${m.homeTeam} vs ${m.awayTeam}`;
}

async function main() {
  if (!URI) throw new Error("MONGODB_URI is required");

  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const now = new Date();

  const matchCollections = ["mundial_matches", "mundial_knockout_matches"];
  let matchUpdates = 0;

  for (const name of matchCollections) {
    const col = db.collection(name);
    for (const m of ROUND16) {
      const patch = {
        ...SHARED,
        ...m,
        sortOrder: m.number,
        updatedAt: now,
      };
      const res = await col.updateOne({ id: m.id }, { $set: patch });
      if (res.matchedCount) matchUpdates += res.modifiedCount;
    }
  }

  const predictions = db.collection("mundial_predictions");
  let pickUpdates = 0;
  for (const m of ROUND16) {
    const res = await predictions.updateMany(
      { matchId: m.id },
      {
        $set: {
          matchNumber: m.number,
          matchLabel: label(m),
          matchTime: m.kickoffAt,
          stage: "round16",
          updatedAt: now,
        },
      }
    );
    pickUpdates += res.modifiedCount;
  }

  console.log(`Round16 sync complete.`);
  console.log(`  Match docs modified: ${matchUpdates}`);
  console.log(`  Predictions updated: ${pickUpdates}`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});