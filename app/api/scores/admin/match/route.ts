import { NextRequest, NextResponse } from "next/server";

import {
  getScoresDb,
  SCORES_COLLECTIONS,
  ensureScoresData,
  getSource,
  requireAdmin,
  isAdminResult,
  writeAdminAudit,
  cleanText,
  parseScore,
  parseIsoDate,
  rescoreMatch,
  type MatchStatus,
  type Sport,
  type MatchDoc,
} from "@/lib/scores";

export const dynamic = "force-dynamic";

const STATUSES = new Set<MatchStatus>([
  "scheduled",
  "live",
  "halftime",
  "finished",
  "postponed",
  "cancelled",
]);

function mapStatus(value: unknown): MatchStatus | null {
  if (value === "fulltime") return "finished";
  if (typeof value === "string" && STATUSES.has(value as MatchStatus)) return value as MatchStatus;
  return null;
}

export async function POST(req: NextRequest) {
  const admin = requireAdmin(req);
  if (isAdminResult(admin)) return admin;

  try {
    const body = await req.json();
    const competitionId = cleanText(body.competitionId ?? body.sourceId, 40) || "manual";
    const source = getSource(competitionId);
    const homeTeam = cleanText(body.homeTeam, 80);
    const awayTeam = cleanText(body.awayTeam, 80);
    const startsAt = parseIsoDate(body.kickoffAt ?? body.startsAt);
    if (!homeTeam || !awayTeam) {
      return NextResponse.json({ error: "Equipos requeridos." }, { status: 400 });
    }
    if (!startsAt) {
      return NextResponse.json({ error: "startsAt/kickoffAt invalido (ISO)." }, { status: 400 });
    }

    const db = await getScoresDb();
    await ensureScoresData(db);
    const col = db.collection(SCORES_COLLECTIONS.MATCHES);
    const number =
      typeof body.number === "number" ? body.number : (await col.countDocuments({ competitionId })) + 1;
    const id =
      cleanText(body.id, 80) ||
      `${competitionId}-${homeTeam}-${awayTeam}-${startsAt.toISOString().slice(0, 10)}`
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-+/g, "-");

    const now = new Date();
    const sport = (source?.sport || "football") as Sport;
    const doc: MatchDoc = {
      id,
      competitionId,
      sourceId: competitionId,
      league: cleanText(body.league, 60) || source?.name || competitionId,
      sport,
      number,
      homeTeam,
      awayTeam,
      startsAt,
      kickoffAt: startsAt,
      predictionClosesAt: startsAt,
      venue: cleanText(body.venue, 100),
      timezone: "UTC",
      status: "scheduled",
      liveStatus: "scheduled",
      homeScore: null,
      awayScore: null,
      homeLiveScore: null,
      awayLiveScore: null,
      liveMinute: null,
      liveNote: "",
      forceClosed: false,
      resultVersion: 0,
      provider: "manual",
      providerMatchId: id,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : number,
      createdAt: now,
      updatedAt: now,
    };

    await col.updateOne({ id }, { $setOnInsert: doc }, { upsert: true });
    await writeAdminAudit(db, {
      adminId: admin.id,
      adminUsername: admin.username,
      action: "match.create",
      matchId: id,
      after: { homeTeam, awayTeam, startsAt },
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("[scores/admin/match POST]", error);
    return NextResponse.json({ error: "No se pudo crear el partido." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = requireAdmin(req);
  if (isAdminResult(admin)) return admin;

  try {
    const body = await req.json();
    const matchId = cleanText(body.matchId, 80);
    if (!matchId) return NextResponse.json({ error: "matchId requerido." }, { status: 400 });

    const db = await getScoresDb();
    await ensureScoresData(db);
    const col = db.collection<MatchDoc>(SCORES_COLLECTIONS.MATCHES);
    const before = await col.findOne({ id: matchId });
    if (!before) return NextResponse.json({ error: "Partido no encontrado." }, { status: 404 });

    const $set: Record<string, unknown> = { updatedAt: new Date() };
    let bumpResult = false;
    let touchedManualFixture = false;

    if ("homeTeam" in body) {
      $set.homeTeam = cleanText(body.homeTeam, 80);
      touchedManualFixture = true;
    }
    if ("awayTeam" in body) {
      $set.awayTeam = cleanText(body.awayTeam, 80);
      touchedManualFixture = true;
    }
    if ("venue" in body) {
      $set.venue = cleanText(body.venue, 100);
      touchedManualFixture = true;
    }
    if ("kickoffAt" in body || "startsAt" in body) {
      const d = parseIsoDate(body.startsAt ?? body.kickoffAt);
      if (!d) return NextResponse.json({ error: "Fecha invalida." }, { status: 400 });
      $set.startsAt = d;
      $set.kickoffAt = d;
      if (!("predictionClosesAt" in body)) $set.predictionClosesAt = d;
      touchedManualFixture = true;
    }
    if ("predictionClosesAt" in body) {
      const d = parseIsoDate(body.predictionClosesAt);
      if (!d) return NextResponse.json({ error: "predictionClosesAt invalido." }, { status: 400 });
      $set.predictionClosesAt = d;
      touchedManualFixture = true;
    }

    const sport = before.sport;
    for (const key of ["homeScore", "awayScore", "homeLiveScore", "awayLiveScore"] as const) {
      if (key in body) {
        const v = body[key] === null || body[key] === "" ? null : parseScore(body[key], sport);
        if (body[key] !== null && body[key] !== "" && v === null) {
          return NextResponse.json({ error: `${key} invalido.` }, { status: 400 });
        }
        $set[key] = v;
        if (key === "homeScore" || key === "awayScore") bumpResult = true;
      }
    }

    if ("liveMinute" in body) {
      if (body.liveMinute === null || body.liveMinute === "") $set.liveMinute = null;
      else {
        const m = Number(body.liveMinute);
        if (!Number.isInteger(m) || m < 0 || m > 200) {
          return NextResponse.json({ error: "liveMinute invalido." }, { status: 400 });
        }
        $set.liveMinute = m;
      }
    }
    if ("liveNote" in body) $set.liveNote = cleanText(body.liveNote, 200);

    if ("liveStatus" in body || "status" in body) {
      const st = mapStatus(body.status ?? body.liveStatus);
      if (!st) return NextResponse.json({ error: "status invalido." }, { status: 400 });
      $set.status = st;
      $set.liveStatus = st;
      if (
        st !== before.status &&
        (st === "finished" || st === "cancelled" || st === "postponed")
      ) {
        bumpResult = true;
      }
      if (st === "finished") {
        bumpResult = true;
        if (!("homeScore" in body) && before.homeScore == null && before.homeLiveScore != null) {
          $set.homeScore = before.homeLiveScore;
        }
        if (!("awayScore" in body) && before.awayScore == null && before.awayLiveScore != null) {
          $set.awayScore = before.awayLiveScore;
        }
      }
    }
    if ("forceClosed" in body) $set.forceClosed = Boolean(body.forceClosed);
    if (touchedManualFixture) $set.manualOverrideAt = new Date();
    if (bumpResult) $set.manualResultOverrideAt = new Date();

    await col.updateOne(
      { id: matchId },
      {
        $set,
        ...(bumpResult ? { $inc: { resultVersion: 1 } } : {}),
      }
    );
    const after = await col.findOne({ id: matchId });
    if (
      after &&
      (after.status === "finished" ||
        after.status === "cancelled" ||
        after.status === "postponed" ||
        after.forceClosed)
    ) {
      await rescoreMatch(db, after);
    }

    await writeAdminAudit(db, {
      adminId: admin.id,
      adminUsername: admin.username,
      action: "match.patch",
      matchId,
      before: {
        status: before.status,
        homeScore: before.homeScore,
        awayScore: before.awayScore,
      },
      after: $set,
      source: "manual",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[scores/admin/match PATCH]", error);
    return NextResponse.json({ error: "No se pudo actualizar." }, { status: 500 });
  }
}
