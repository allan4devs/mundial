/**
 * Seed: current FIFA World Cup 2026 rosters.
 *
 * Fetches the latest public squad tables and upserts:
 *   - mundial_rosters: one document per player
 *   - mundial_roster_teams: one summary document per team
 *
 * Usage:
 *   node --env-file=.env scripts/seed-mundial-rosters.mjs --dry-run
 *   node --env-file=.env scripts/seed-mundial-rosters.mjs
 */

import * as cheerio from "cheerio";
import { MongoClient } from "mongodb";

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "lva";
const PLAYER_COLLECTION = "mundial_rosters";
const TEAM_COLLECTION = "mundial_roster_teams";

const SOURCE_PAGE_URL = "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads";
const SOURCE_FETCH_URL =
  process.env.MUNDIAL_ROSTERS_SOURCE_URL || `${SOURCE_PAGE_URL}?action=render`;
const SOURCE_NAME = "Wikipedia - 2026 FIFA World Cup squads";

const DRY_RUN = process.argv.includes("--dry-run");

const GROUPS = [
  { group: "A", teams: ["Mexico", "South Africa", "Korea Republic", "Czechia"] },
  { group: "B", teams: ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"] },
  { group: "C", teams: ["Brazil", "Morocco", "Haiti", "Scotland"] },
  { group: "D", teams: ["USA", "Paraguay", "Australia", "Turkiye"] },
  { group: "E", teams: ["Germany", "Curacao", "Cote d'Ivoire", "Ecuador"] },
  { group: "F", teams: ["Netherlands", "Japan", "Sweden", "Tunisia"] },
  { group: "G", teams: ["Belgium", "Egypt", "IR Iran", "New Zealand"] },
  { group: "H", teams: ["Spain", "Cabo Verde", "Saudi Arabia", "Uruguay"] },
  { group: "I", teams: ["France", "Senegal", "Iraq", "Norway"] },
  { group: "J", teams: ["Argentina", "Algeria", "Austria", "Jordan"] },
  { group: "K", teams: ["Portugal", "Congo DR", "Uzbekistan", "Colombia"] },
  { group: "L", teams: ["England", "Croatia", "Ghana", "Panama"] },
];

const TEAM_GROUP = new Map(
  GROUPS.flatMap(({ group, teams }) => teams.map((team) => [team, group]))
);

const APP_TEAM_BY_SOURCE_TEAM = new Map([
  ["Cape Verde", "Cabo Verde"],
  ["Curaçao", "Curacao"],
  ["Czech Republic", "Czechia"],
  ["DR Congo", "Congo DR"],
  ["Iran", "IR Iran"],
  ["Ivory Coast", "Cote d'Ivoire"],
  ["South Korea", "Korea Republic"],
  ["Turkey", "Turkiye"],
  ["United States", "USA"],
]);

const POSITION_BY_SOURCE_CODE = {
  GK: { pos: "GK", label: "Goalkeeper" },
  DF: { pos: "DEF", label: "Defender" },
  MF: { pos: "MID", label: "Midfielder" },
  FW: { pos: "FWD", label: "Forward" },
};

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function toAbsoluteWikiUrl(href) {
  if (!href) return null;
  if (href.startsWith("//")) return `https:${href}`;
  if (href.startsWith("/")) return `https://en.wikipedia.org${href}`;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  return null;
}

function toInt(value) {
  const normalized = cleanText(value).replace(/[^\d-]/g, "");
  if (!normalized) return null;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function round(value, decimals = 2) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function slugify(value) {
  return cleanText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function appTeamName(sourceTeam) {
  const cleaned = cleanText(sourceTeam);
  return APP_TEAM_BY_SOURCE_TEAM.get(cleaned) ?? cleaned;
}

function parsePosition(value) {
  const code = cleanText(value).match(/(GK|DF|MF|FW)/)?.[1] ?? "";
  return {
    sourceCode: code || null,
    ...(POSITION_BY_SOURCE_CODE[code] ?? { pos: "UNK", label: "Unknown" }),
  };
}

function readLinkedText($, cell, mode = "first") {
  const links = $(cell)
    .find("a")
    .toArray()
    .filter((link) => cleanText($(link).text()));
  const link = mode === "last" ? links.at(-1) : links[0];
  return {
    text: cleanText(link ? $(link).text() : $(cell).text()),
    href: toAbsoluteWikiUrl(link ? $(link).attr("href") : null),
  };
}

function parseRosterRow($, row, context, now) {
  const cells = $(row).children("th,td").toArray();
  if (cells.length < 7) return null;

  const squadNumber = toInt($(cells[0]).text());
  const position = parsePosition($(cells[1]).text());
  const playerLink = readLinkedText($, cells[2], "first");
  const name = cleanText(playerLink.text.replace(/\(\s*captain\s*\)/gi, ""));
  const birthText = cleanText($(cells[3]).text());
  const dateOfBirth =
    cleanText($(cells[3]).find(".bday").first().text()) ||
    birthText.match(/\d{4}-\d{2}-\d{2}/)?.[0] ||
    null;
  const age = toInt(birthText.match(/aged\s+(\d+)/i)?.[1]);
  const caps = toInt($(cells[4]).text()) ?? 0;
  const goals = toInt($(cells[5]).text()) ?? 0;
  const clubLink = readLinkedText($, cells[6], "last");
  const club = clubLink.text || cleanText($(cells[6]).text()) || null;
  const isCaptain = /\bcaptain\b/i.test($(cells[2]).text());

  if (!name || !squadNumber || !position.sourceCode) return null;

  return {
    name,
    slug: slugify(name),
    team: context.team,
    teamSlug: slugify(context.team),
    wikiTeam: context.wikiTeam,
    group: context.group,
    squadNumber,
    pos: position.pos,
    positionCode: position.sourceCode,
    position: position.label,
    dateOfBirth,
    age,
    caps,
    goals,
    club,
    captain: isCaptain,
    stats: {
      caps,
      goals,
      goalsPerCap: caps > 0 ? round(goals / caps, 3) : null,
      ageAtTournamentStart: age,
    },
    links: {
      player: playerLink.href,
      club: clubLink.href,
    },
    source: {
      name: SOURCE_NAME,
      url: SOURCE_PAGE_URL,
      fetchedAt: now,
      notes: "Caps and goals are listed by the source as of the start of the tournament.",
    },
    active: true,
    updatedAt: now,
  };
}

function summarizeRoster(roster, now) {
  const positionCounts = roster.players.reduce(
    (counts, player) => {
      counts[player.pos] = (counts[player.pos] ?? 0) + 1;
      return counts;
    },
    { GK: 0, DEF: 0, MID: 0, FWD: 0 }
  );
  const totalCaps = roster.players.reduce((sum, player) => sum + (player.caps ?? 0), 0);
  const totalGoals = roster.players.reduce((sum, player) => sum + (player.goals ?? 0), 0);
  const ages = roster.players.map((player) => player.age).filter((age) => Number.isFinite(age));
  const captain = roster.players.find((player) => player.captain)?.name ?? null;

  return {
    team: roster.team,
    teamSlug: slugify(roster.team),
    wikiTeam: roster.wikiTeam,
    group: roster.group,
    coach: roster.coach,
    playerCount: roster.players.length,
    captain,
    positionCounts,
    totalCaps,
    totalGoals,
    averageAge: ages.length ? round(ages.reduce((sum, age) => sum + age, 0) / ages.length, 2) : null,
    source: {
      name: SOURCE_NAME,
      url: SOURCE_PAGE_URL,
      fetchedAt: now,
    },
    active: true,
    updatedAt: now,
  };
}

function isRosterTable($, table) {
  const header = cleanText($(table).find("tr").first().text());
  return /No\.\s+Pos\.\s+Player\s+Date of birth/i.test(header);
}

async function fetchSquadHtml() {
  const response = await fetch(SOURCE_FETCH_URL, {
    headers: {
      "user-agent": "mvp-laviejadventures-roster-seed/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`Could not fetch squads source (${response.status} ${response.statusText}).`);
  }
  return {
    html: await response.text(),
    lastModified: response.headers.get("last-modified"),
  };
}

async function readRosters() {
  const now = new Date();
  const { html, lastModified } = await fetchSquadHtml();
  const $ = cheerio.load(html);
  const rosters = [];

  let currentGroup = "";
  let currentWikiTeam = "";
  let currentCoach = "";

  $(".mw-parser-output")
    .find("h2,h3,p,table.wikitable")
    .each((_, element) => {
      if (element.tagName === "h2") {
        currentGroup = cleanText($(element).text()).match(/Group\s+([A-L])/i)?.[1] ?? currentGroup;
        return;
      }

      if (element.tagName === "h3") {
        currentWikiTeam = cleanText($(element).text());
        currentCoach = "";
        return;
      }

      if (element.tagName === "p" && currentWikiTeam) {
        const text = cleanText($(element).text());
        if (/^Coach:/i.test(text)) {
          currentCoach = readLinkedText($, element, "first").text.replace(/^Coach:\s*/i, "");
        }
        return;
      }

      if (element.tagName !== "table" || !currentWikiTeam || !isRosterTable($, element)) return;

      const team = appTeamName(currentWikiTeam);
      const group = TEAM_GROUP.get(team) ?? currentGroup;
      const players = $(element)
        .find("tr")
        .slice(1)
        .toArray()
        .map((row) =>
          parseRosterRow(
            $,
            row,
            {
              team,
              wikiTeam: currentWikiTeam,
              group,
            },
            now
          )
        )
        .filter(Boolean);

      if (TEAM_GROUP.has(team) && players.length > 0) {
        rosters.push({
          team,
          wikiTeam: currentWikiTeam,
          group,
          coach: currentCoach || null,
          players,
        });
      }
    });

  const expectedTeams = [...TEAM_GROUP.keys()];
  const seenTeams = new Set(rosters.map((roster) => roster.team));
  const missingTeams = expectedTeams.filter((team) => !seenTeams.has(team));

  if (missingTeams.length > 0) {
    throw new Error(`Missing roster data for: ${missingTeams.join(", ")}`);
  }

  const extraTeams = rosters.filter((roster) => !TEAM_GROUP.has(roster.team)).map((roster) => roster.team);

  return {
    rosters: rosters.sort((a, b) => a.group.localeCompare(b.group) || a.team.localeCompare(b.team)),
    teamDocs: rosters.map((roster) => summarizeRoster(roster, now)),
    playerDocs: rosters.flatMap((roster) => roster.players),
    sourceLastModified: lastModified,
    extraTeams,
  };
}

function printSummary({ rosters, playerDocs, teamDocs, sourceLastModified }) {
  console.log(`\nSource: ${SOURCE_PAGE_URL}`);
  if (sourceLastModified) console.log(`Last modified: ${sourceLastModified}`);
  console.log(`Teams: ${teamDocs.length}`);
  console.log(`Players: ${playerDocs.length}`);
  console.log("\nRoster counts:");

  for (const roster of rosters) {
    const summary = teamDocs.find((team) => team.team === roster.team);
    console.log(
      `  Group ${roster.group}  ${roster.team.padEnd(28)} ${String(roster.players.length).padStart(2)} players` +
        `  caps:${String(summary?.totalCaps ?? 0).padStart(4)} goals:${String(summary?.totalGoals ?? 0).padStart(3)}`
    );
  }
}

async function seed() {
  const data = await readRosters();
  printSummary(data);

  if (DRY_RUN) {
    console.log("\nDry run only. Mongo was not modified.");
    return;
  }

  if (!URI) {
    console.error("MONGODB_URI is not defined.");
    process.exit(1);
  }

  const client = new MongoClient(URI);
  const now = new Date();

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const playerCollection = db.collection(PLAYER_COLLECTION);
    const teamCollection = db.collection(TEAM_COLLECTION);

    await Promise.all([
      playerCollection.createIndex({ team: 1, name: 1 }, { unique: true }),
      playerCollection.createIndex({ team: 1, active: 1 }),
      playerCollection.createIndex({ group: 1 }),
      playerCollection.createIndex({ teamSlug: 1, slug: 1 }),
      teamCollection.createIndex({ team: 1 }, { unique: true }),
      teamCollection.createIndex({ group: 1 }),
    ]);

    const playerResult = await playerCollection.bulkWrite(
      data.playerDocs.map((doc) => ({
        updateOne: {
          filter: { team: doc.team, name: doc.name },
          update: {
            $set: doc,
            $setOnInsert: { createdAt: now },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );

    const teamResult = await teamCollection.bulkWrite(
      data.teamDocs.map((doc) => ({
        updateOne: {
          filter: { team: doc.team },
          update: {
            $set: doc,
            $setOnInsert: { createdAt: now },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );

    let stalePlayers = 0;
    for (const roster of data.rosters) {
      const names = roster.players.map((player) => player.name);
      const staleResult = await playerCollection.updateMany(
        { team: roster.team, active: true, name: { $nin: names } },
        {
          $set: {
            active: false,
            removedFromLatestSeedAt: now,
            updatedAt: now,
          },
        }
      );
      stalePlayers += staleResult.modifiedCount;
    }

    console.log("\nMongo seed completed.");
    console.log(`  Database: ${DB_NAME}`);
    console.log(`  Players collection: ${PLAYER_COLLECTION}`);
    console.log(`    inserted: ${playerResult.upsertedCount}`);
    console.log(`    matched:  ${playerResult.matchedCount}`);
    console.log(`    updated:  ${playerResult.modifiedCount}`);
    console.log(`    stale:    ${stalePlayers}`);
    console.log(`  Teams collection: ${TEAM_COLLECTION}`);
    console.log(`    inserted: ${teamResult.upsertedCount}`);
    console.log(`    matched:  ${teamResult.matchedCount}`);
    console.log(`    updated:  ${teamResult.modifiedCount}`);
  } finally {
    await client.close();
  }
}

seed().catch((error) => {
  console.error("Roster seed failed:", error);
  process.exit(1);
});
