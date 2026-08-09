import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import { serializeLiveMatchStats } from "@/lib/mundial/live-stats";
import { notifyLiveMatchChanged } from "@/lib/mundial/live-match-events";
import { notifyPenalitosChanged } from "@/lib/mundial/penalitos-events";
import { notifyScorerChanged } from "@/lib/mundial/scorer-events";
import { getMundialMatchCollectionForWrite, MUNDIAL_PREDICTIONS_COLLECTION } from "@/lib/mundial/matches-store";
import { propagateKnockoutAdvancement } from "@/lib/mundial/knockout-advance";

export const dynamic = "force-dynamic";

const MAX_SCORE = 30;
const MAX_LIVE_MINUTE = 130;

type LiveMatchStatus = "scheduled" | "live" | "halftime" | "fulltime";
type LiveEventType = "goal" | "penalty" | "yellow" | "red" | "var" | "substitution" | "note";
type LiveEventTeam = "home" | "away" | null;
type MatchDecisionMethod = "regular" | "extraTime" | "penalties";

const LIVE_STATUSES = new Set<LiveMatchStatus>(["scheduled", "live", "halftime", "fulltime"]);
const DECISION_METHODS = new Set<MatchDecisionMethod>(["regular", "extraTime", "penalties"]);
const LIVE_EVENT_TYPES = new Set<LiveEventType>([
  "goal",
  "penalty",
  "yellow",
  "red",
  "var",
  "substitution",
  "note",
]);

function parseScore(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const score = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) return null;
  return score;
}

function parseLiveMinute(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const minute = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(minute) || minute < 0 || minute > MAX_LIVE_MINUTE) return null;
  return minute;
}

function parseLiveStatus(value: unknown): LiveMatchStatus | null {
  return typeof value === "string" && LIVE_STATUSES.has(value as LiveMatchStatus)
    ? (value as LiveMatchStatus)
    : null;
}

function parseDecisionMethod(value: unknown): MatchDecisionMethod | null {
  return typeof value === "string" && DECISION_METHODS.has(value as MatchDecisionMethod)
    ? (value as MatchDecisionMethod)
    : null;
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function liveEventSignature(event: {
  type: LiveEventType;
  team: LiveEventTeam;
  minute: number | null;
  player: string;
  note: string;
}) {
  return [
    event.type,
    event.team ?? "general",
    event.minute ?? "",
    event.player.trim().toUpperCase(),
    event.note.trim().toUpperCase(),
  ].join("|");
}

function parseLiveEvents(value: unknown) {
  if (!Array.isArray(value) || value.length > 40) return null;
  const now = new Date().toISOString();

  const parsed = value.map((raw, index) => {
    const event = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const type = typeof event.type === "string" && LIVE_EVENT_TYPES.has(event.type as LiveEventType)
      ? event.type as LiveEventType
      : "note";
    const team: LiveEventTeam = event.team === "home" || event.team === "away" ? event.team : null;
    const minute = parseLiveMinute(event.minute);
    const id = cleanText(event.id, 80) || `${Date.now()}-${index}`;
    const createdAt = cleanText(event.createdAt, 40) || now;

    return {
      id,
      type,
      team,
      minute,
      player: cleanText(event.player, 80),
      note: cleanText(event.note, 160),
      createdAt,
    };
  });

  const seen = new Set<string>();
  return parsed.filter((event) => {
    const signature = liveEventSignature(event);
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { matchId, homeFinalScore, awayFinalScore, homeRegulationScore, awayRegulationScore, forceClosed, actualWinner, decisionMethod } = body;

    if (!matchId || typeof matchId !== "string") {
      return NextResponse.json({ error: "matchId requerido." }, { status: 400 });
    }

    const db = await getDb();
    const $set: Record<string, unknown> = { updatedAt: new Date() };
    let touchedLiveState = false;
    let touchedFinalScore = false;
    let touchedFixture = false;

    // Fixture data (teams, kickoff, venue) lives in Mongo; this is the only
    // supported way to change it after the initial seed.
    if ("homeTeam" in body) {
      const parsed = cleanText(body.homeTeam, 60);
      if (!parsed) {
        return NextResponse.json({ error: "homeTeam invalido." }, { status: 400 });
      }
      $set.homeTeam = parsed;
      touchedFixture = true;
    }

    if ("awayTeam" in body) {
      const parsed = cleanText(body.awayTeam, 60);
      if (!parsed) {
        return NextResponse.json({ error: "awayTeam invalido." }, { status: 400 });
      }
      $set.awayTeam = parsed;
      touchedFixture = true;
    }

    if ("kickoffAt" in body) {
      const raw = cleanText(body.kickoffAt, 40);
      if (!/^\d{4}-\d{2}-\d{2}T/.test(raw) || Number.isNaN(new Date(raw).getTime())) {
        return NextResponse.json({ error: "kickoffAt invalido (ISO 8601)." }, { status: 400 });
      }
      $set.kickoffAt = raw;
      $set.date = raw.slice(0, 10);
      touchedFixture = true;
    }

    if ("venue" in body) {
      const parsed = cleanText(body.venue, 100);
      if (!parsed) {
        return NextResponse.json({ error: "venue invalido." }, { status: 400 });
      }
      $set.venue = parsed;
      touchedFixture = true;
    }

    if ("homeFinalScore" in body) {
      const parsed = body.homeFinalScore === null ? null : parseScore(homeFinalScore);
      if (body.homeFinalScore !== null && parsed === null) {
        return NextResponse.json({ error: "homeFinalScore invalido (0-30)." }, { status: 400 });
      }
      $set.homeFinalScore = parsed;
      touchedFinalScore = true;
    }

    if ("awayFinalScore" in body) {
      const parsed = body.awayFinalScore === null ? null : parseScore(awayFinalScore);
      if (body.awayFinalScore !== null && parsed === null) {
        return NextResponse.json({ error: "awayFinalScore invalido (0-30)." }, { status: 400 });
      }
      $set.awayFinalScore = parsed;
      touchedFinalScore = true;
    }

    if ("homeRegulationScore" in body) {
      const parsed = body.homeRegulationScore === null || body.homeRegulationScore === "" ? null : parseScore(homeRegulationScore);
      if (body.homeRegulationScore !== null && body.homeRegulationScore !== "" && parsed === null) {
        return NextResponse.json({ error: "homeRegulationScore invalido (0-30)." }, { status: 400 });
      }
      $set.homeRegulationScore = parsed;
      touchedFinalScore = true;
    }

    if ("awayRegulationScore" in body) {
      const parsed = body.awayRegulationScore === null || body.awayRegulationScore === "" ? null : parseScore(awayRegulationScore);
      if (body.awayRegulationScore !== null && body.awayRegulationScore !== "" && parsed === null) {
        return NextResponse.json({ error: "awayRegulationScore invalido (0-30)." }, { status: 400 });
      }
      $set.awayRegulationScore = parsed;
      touchedFinalScore = true;
    }

    if ("forceClosed" in body) {
      $set.forceClosed = Boolean(forceClosed);
    }

    if ("actualWinner" in body) {
      $set.actualWinner = actualWinner === "home" || actualWinner === "away" ? actualWinner : null;
    }

    if ("decisionMethod" in body) {
      const parsed = body.decisionMethod === null || body.decisionMethod === "" ? null : parseDecisionMethod(decisionMethod);
      if (body.decisionMethod !== null && body.decisionMethod !== "" && parsed === null) {
        return NextResponse.json({ error: "decisionMethod invalido." }, { status: 400 });
      }
      $set.decisionMethod = parsed;
    }

    if ("liveStatus" in body) {
      const parsed = parseLiveStatus(body.liveStatus);
      if (!parsed) {
        return NextResponse.json({ error: "liveStatus invalido." }, { status: 400 });
      }
      $set.liveStatus = parsed;
      $set.liveUpdatedAt = new Date();
      touchedLiveState = true;
    }

    if ("liveMinute" in body) {
      const parsed = parseLiveMinute(body.liveMinute);
      if (body.liveMinute !== null && body.liveMinute !== "" && parsed === null) {
        return NextResponse.json({ error: "liveMinute invalido (0-130)." }, { status: 400 });
      }
      $set.liveMinute = parsed;
      $set.liveMinuteUpdatedAt = parsed !== null ? new Date() : null;
      $set.liveUpdatedAt = new Date();
      touchedLiveState = true;
    }

    if ("homeLiveScore" in body) {
      const parsed = body.homeLiveScore === null || body.homeLiveScore === "" ? null : parseScore(body.homeLiveScore);
      if (body.homeLiveScore !== null && body.homeLiveScore !== "" && parsed === null) {
        return NextResponse.json({ error: "homeLiveScore invalido (0-30)." }, { status: 400 });
      }
      $set.homeLiveScore = parsed;
      $set.liveUpdatedAt = new Date();
      touchedLiveState = true;
    }

    if ("awayLiveScore" in body) {
      const parsed = body.awayLiveScore === null || body.awayLiveScore === "" ? null : parseScore(body.awayLiveScore);
      if (body.awayLiveScore !== null && body.awayLiveScore !== "" && parsed === null) {
        return NextResponse.json({ error: "awayLiveScore invalido (0-30)." }, { status: 400 });
      }
      $set.awayLiveScore = parsed;
      $set.liveUpdatedAt = new Date();
      touchedLiveState = true;
    }

    if ("liveNote" in body) {
      $set.liveNote = cleanText(body.liveNote, 220);
      $set.liveUpdatedAt = new Date();
      touchedLiveState = true;
    }

    if ("liveEvents" in body) {
      const parsed = parseLiveEvents(body.liveEvents);
      if (parsed === null) {
        return NextResponse.json({ error: "liveEvents invalido (max 40 eventos)." }, { status: 400 });
      }
      $set.liveEvents = parsed;
      $set.liveUpdatedAt = new Date();
      touchedLiveState = true;
    }

    if ("liveStats" in body) {
      $set.liveStats = serializeLiveMatchStats(body.liveStats);
      $set.liveUpdatedAt = new Date();
      touchedLiveState = true;
    }

    if ($set.liveStatus === "fulltime") {
      const finalHomeScore =
        typeof $set.homeLiveScore === "number"
          ? $set.homeLiveScore
          : parseScore(body.homeLiveScore);
      const finalAwayScore =
        typeof $set.awayLiveScore === "number"
          ? $set.awayLiveScore
          : parseScore(body.awayLiveScore);

      if (typeof finalHomeScore === "number" && typeof finalAwayScore === "number") {
        $set.homeFinalScore = finalHomeScore;
        $set.awayFinalScore = finalAwayScore;
        $set.forceClosed = true;
        if (!("actualWinner" in body)) {
          $set.actualWinner =
            finalHomeScore > finalAwayScore ? "home" : finalAwayScore > finalHomeScore ? "away" : null;
        }
        if (!("decisionMethod" in body)) {
          $set.decisionMethod = finalHomeScore === finalAwayScore ? null : "regular";
        }
      }
    }

    if (touchedFinalScore) {
      const writeCollection = await getMundialMatchCollectionForWrite(db, matchId);
      const existingMatch = await writeCollection
        .findOne<{
          homeFinalScore?: number | null;
          awayFinalScore?: number | null;
          homeRegulationScore?: number | null;
          awayRegulationScore?: number | null;
          stage?: string;
          actualWinner?: "home" | "away" | null;
          decisionMethod?: MatchDecisionMethod | null;
        }>({ id: matchId }, { projection: { homeFinalScore: 1, awayFinalScore: 1, homeRegulationScore: 1, awayRegulationScore: 1, stage: 1, actualWinner: 1, decisionMethod: 1 } });

      if (!existingMatch) {
        return NextResponse.json({ error: "Partido no encontrado." }, { status: 404 });
      }

      const finalHomeScore =
        "homeFinalScore" in $set ? $set.homeFinalScore : existingMatch.homeFinalScore;
      const finalAwayScore =
        "awayFinalScore" in $set ? $set.awayFinalScore : existingMatch.awayFinalScore;

      if (typeof finalHomeScore === "number" && typeof finalAwayScore === "number") {
        const finalActualWinner =
          "actualWinner" in $set ? $set.actualWinner : existingMatch.actualWinner;
        const finalDecisionMethod =
          "decisionMethod" in $set ? $set.decisionMethod : existingMatch.decisionMethod;
        const scoringHomeScore =
          "homeRegulationScore" in $set ? $set.homeRegulationScore : existingMatch.homeRegulationScore;
        const scoringAwayScore =
          "awayRegulationScore" in $set ? $set.awayRegulationScore : existingMatch.awayRegulationScore;

        if (existingMatch.stage !== "group" && finalHomeScore !== finalAwayScore) {
          $set.actualWinner = finalHomeScore > finalAwayScore ? "home" : "away";
          if (!("decisionMethod" in body)) $set.decisionMethod = finalDecisionMethod ?? "regular";
        }

        if (
          existingMatch.stage !== "group" &&
          (finalHomeScore === finalAwayScore || finalDecisionMethod === "extraTime" || finalDecisionMethod === "penalties") &&
          finalActualWinner !== "home" &&
          finalActualWinner !== "away"
        ) {
          return NextResponse.json(
            { error: "En eliminatoria empatada tenes que elegir quien pasa." },
            { status: 400 }
          );
        }

        if (
          existingMatch.stage !== "group" &&
          finalHomeScore === finalAwayScore &&
          finalDecisionMethod !== "extraTime" &&
          finalDecisionMethod !== "penalties"
        ) {
          return NextResponse.json(
            { error: "En eliminatoria empatada tenes que elegir tiempos extra o penales." },
            { status: 400 }
          );
        }

        if (
          existingMatch.stage !== "group" &&
          (finalDecisionMethod === "extraTime" || finalDecisionMethod === "penalties") &&
          (typeof scoringHomeScore !== "number" || typeof scoringAwayScore !== "number" || scoringHomeScore !== scoringAwayScore)
        ) {
          return NextResponse.json(
            { error: "Para tiempos extra o penales, guarda el marcador empatado al final de 90 minutos." },
            { status: 400 }
          );
        }

        if (!("forceClosed" in body)) $set.forceClosed = true;
      }
    }

    const writeCollection = await getMundialMatchCollectionForWrite(db, matchId);
    const result = await writeCollection.updateOne({ id: matchId }, { $set });

    if (!result.matchedCount) {
      return NextResponse.json({ error: "Partido no encontrado." }, { status: 404 });
    }

    // Keep denormalized prediction labels in sync with the edited fixture
    if (touchedFixture) {
      const updated = await writeCollection.findOne<{
        number?: number;
        stage?: string;
        homeTeam?: string;
        awayTeam?: string;
        kickoffAt?: string;
      }>({ id: matchId }, { projection: { number: 1, stage: 1, homeTeam: 1, awayTeam: 1, kickoffAt: 1 } });

      if (updated?.homeTeam && updated.awayTeam) {
        await db.collection(MUNDIAL_PREDICTIONS_COLLECTION).updateMany(
          { matchId },
          {
            $set: {
              matchNumber: updated.number,
              matchLabel: `${updated.homeTeam} vs ${updated.awayTeam}`,
              matchTime: updated.kickoffAt,
              stage: updated.stage,
              updatedAt: new Date(),
            },
          }
        );
      }
    }

    // Result changed → push the decided winner into the next round (Mongo only)
    const touchedResult =
      touchedFinalScore ||
      "actualWinner" in body ||
      "decisionMethod" in body ||
      $set.liveStatus === "fulltime";
    if (touchedResult) {
      try {
        await propagateKnockoutAdvancement(db);
      } catch (error) {
        console.error("Failed to propagate knockout advancement", error);
      }
    }

    if (touchedLiveState) {
      notifyLiveMatchChanged();
      notifyPenalitosChanged();
      notifyScorerChanged();
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update match", error);
    return NextResponse.json({ error: "No se pudo actualizar el partido." }, { status: 500 });
  }
}
