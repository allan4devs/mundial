import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";
import type { MundialMatch } from "@/lib/mundial/fixtures";
import { serializeLiveMatchStats, type LiveMatchStats } from "@/lib/mundial/live-stats";
import { propagateKnockoutAdvancement } from "@/lib/mundial/knockout-advance";
import { computePredictionResult } from "@/lib/mundial/prediction-scoring";

export const dynamic = "force-dynamic";

const PREDICTIONS_COLLECTION = "mundial_predictions";
const STAT_QUESTIONS_COLLECTION = "mundial_stat_questions";
const STAT_BETS_COLLECTION = "mundial_stat_bets";
const ROSTERS_COLLECTION = "mundial_rosters";
const ANALYTICS_LIMIT = 250;

type WinnerPick = "home" | "away" | null;
type LiveMatchStatus = "scheduled" | "live" | "halftime" | "fulltime";
type MatchDecisionMethod = "regular" | "extraTime" | "penalties";

type MundialMatchDoc = MundialMatch & {
  forceClosed?: boolean;
  actualWinner?: WinnerPick;
  decisionMethod?: MatchDecisionMethod;
  homeFinalScore?: number;
  awayFinalScore?: number;
  homeRegulationScore?: number;
  awayRegulationScore?: number;
  liveStatus?: LiveMatchStatus;
  liveMinute?: number | null;
  liveMinuteUpdatedAt?: Date | string | null;
  homeLiveScore?: number | null;
  awayLiveScore?: number | null;
  liveNote?: string;
  liveEvents?: LiveMatchEventDoc[];
  liveStats?: LiveMatchStats;
  liveUpdatedAt?: Date | string | null;
};

type LiveMatchEventDoc = {
  id?: string;
  type?: "goal" | "penalty" | "yellow" | "red" | "var" | "substitution" | "note";
  team?: "home" | "away" | null;
  minute?: number | null;
  player?: string;
  note?: string;
  createdAt?: Date | string | null;
};

type PredictionDoc = {
  _id: ObjectId;
  matchId: string;
  playerName: string;
  normalizedName: string;
  homeScore?: number;
  awayScore?: number;
  mexicoScore?: number;
  southAfricaScore?: number;
  winnerPick?: WinnerPick;
  winnerPickMethod?: "extraTime" | "penalties" | null;
  stage?: string;
  updatedAt?: Date;
};

type StatQuestionDoc = {
  _id: ObjectId;
  id: string;
  matchId: string;
  matchNumber: number;
  matchLabel: string;
  text: string;
  options: Array<{ id: string; label: string }>;
  correctOptionId: string | null;
  pointValue: number;
  resolvedAt: Date | null;
  createdAt: Date;
};

type StatBetDoc = {
  questionId: string;
  playerName?: string;
  normalizedName: string;
  optionId: string;
};

type RosterPlayerDoc = {
  name?: string;
  team?: string;
  squadNumber?: number;
  pos?: string;
  position?: string;
  club?: string | null;
  caps?: number;
  goals?: number;
  active?: boolean;
};

type MundialAnalyticsEventName = "login" | "pick_saved" | "stat_bet_saved";

const HALF_MINUTES = 45;
const STANDARD_HALFTIME_MINUTES = 15;
const FINAL_HALFTIME_MINUTES = 27;
const HYDRATION_BREAK_MINUTES = 3;
const AVERAGE_STOPPAGE_PER_HALF_MINUTES = 3;
const HALF_REAL_DURATION_MINUTES = HALF_MINUTES + HYDRATION_BREAK_MINUTES + AVERAGE_STOPPAGE_PER_HALF_MINUTES;

type MundialAnalyticsDoc = {
  _id: ObjectId;
  event?: MundialAnalyticsEventName;
  playerName?: string;
  normalizedName?: string;
  happenedAt?: Date | string | null;
  createdAt?: Date | string | null;
  metadata?: Record<string, unknown>;
  request?: {
    ipAnonymized?: string | null;
    country?: string | null;
    region?: string | null;
    city?: string | null;
    userAgent?: string;
  };
};

type PremiumDoc = {
  playerKey?: string;
  playerName?: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  amountPaid?: number;
  currency?: string;
  payer?: string | null;
  paidAt?: Date | string | null;
};

type PremiumPredictionDoc = {
  id?: string;
  playerKey?: string;
  playerName?: string;
  stage?: string;
  slot?: number;
  teamA?: string;
  teamB?: string;
  scoreA?: number | null;
  scoreB?: number | null;
  winner?: "teamA" | "teamB" | "";
  confidence?: number | null;
  note?: string;
  updatedAt?: Date | string | null;
};

function kickoffTime(match: MundialMatchDoc | MundialMatch) {
  const t = new Date(match.kickoffAt).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

function isMatchClosed(match: MundialMatchDoc | MundialMatch, now: Date) {
  if ((match as MundialMatchDoc).forceClosed) return true;
  return kickoffTime(match) <= now.getTime();
}

function halftimeMinutes(match: MundialMatchDoc) {
  return match.stage === "final" ? FINAL_HALFTIME_MINUTES : STANDARD_HALFTIME_MINUTES;
}

function autoLiveMaxMinutes(match: MundialMatchDoc) {
  return (HALF_REAL_DURATION_MINUTES * 2) + halftimeMinutes(match);
}

function storedLiveStatus(match: MundialMatchDoc): LiveMatchStatus {
  return match.liveStatus === "live" || match.liveStatus === "halftime" || match.liveStatus === "fulltime"
    ? match.liveStatus
    : "scheduled";
}

function isMatchAutoLive(match: MundialMatchDoc, nowMs: number) {
  if (!nowMs || storedLiveStatus(match) !== "scheduled" || match.forceClosed) return false;
  if (typeof match.homeFinalScore === "number" && typeof match.awayFinalScore === "number") return false;
  const elapsed = nowMs - kickoffTime(match);
  return elapsed >= 0 && elapsed < autoLiveMaxMinutes(match) * 60_000;
}

function autoLiveMinute(match: MundialMatchDoc, nowMs: number): number | null {
  const ko = kickoffTime(match);
  if (!nowMs || nowMs < ko) return null;
  const elapsed = Math.floor((nowMs - ko) / 60_000);
  const firstHalfEnd = HALF_REAL_DURATION_MINUTES;
  const secondHalfStart = firstHalfEnd + halftimeMinutes(match);
  const fullTime = secondHalfStart + HALF_REAL_DURATION_MINUTES;

  if (elapsed >= fullTime) return null;
  if (elapsed < firstHalfEnd) return Math.min(elapsed, HALF_MINUTES + AVERAGE_STOPPAGE_PER_HALF_MINUTES);
  if (elapsed < secondHalfStart) return HALF_MINUTES;

  const secondHalfElapsed = elapsed - secondHalfStart;
  return Math.min(HALF_MINUTES + secondHalfElapsed, (HALF_MINUTES * 2) + AVERAGE_STOPPAGE_PER_HALF_MINUTES);
}

function effectiveLiveStatus(match: MundialMatchDoc, nowMs: number): LiveMatchStatus {
  const status = storedLiveStatus(match);
  if (!isMatchAutoLive(match, nowMs)) return status;
  const elapsed = Math.floor((nowMs - kickoffTime(match)) / 60_000);
  const firstHalfEnd = HALF_REAL_DURATION_MINUTES;
  const secondHalfStart = firstHalfEnd + halftimeMinutes(match);
  return elapsed >= firstHalfEnd && elapsed < secondHalfStart ? "halftime" : "live";
}

function toIsoString(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function serializeLiveEvent(event: LiveMatchEventDoc, index: number) {
  return {
    id: event.id ?? `event-${index}`,
    type: event.type ?? "note",
    team: event.team === "home" || event.team === "away" ? event.team : null,
    minute: typeof event.minute === "number" ? event.minute : null,
    player: event.player ?? "",
    note: event.note ?? "",
    createdAt: toIsoString(event.createdAt),
  };
}

function serializeAnalyticsEvent(doc: MundialAnalyticsDoc) {
  return {
    id: doc._id.toString(),
    event: doc.event ?? "login",
    playerName: doc.playerName ?? doc.normalizedName ?? "",
    normalizedName: doc.normalizedName ?? "",
    happenedAt: toIsoString(doc.happenedAt),
    createdAt: toIsoString(doc.createdAt),
    metadata: doc.metadata ?? {},
    request: {
      ipAnonymized: doc.request?.ipAnonymized ?? null,
      country: doc.request?.country ?? null,
      region: doc.request?.region ?? null,
      city: doc.request?.city ?? null,
      userAgent: doc.request?.userAgent ?? "",
    },
  };
}

function serializeRosterPlayer(doc: RosterPlayerDoc) {
  return {
    name: doc.name ?? "",
    team: doc.team ?? "",
    squadNumber: typeof doc.squadNumber === "number" ? doc.squadNumber : null,
    pos: doc.pos ?? "",
    position: doc.position ?? "",
    club: doc.club ?? null,
    caps: typeof doc.caps === "number" ? doc.caps : null,
    goals: typeof doc.goals === "number" ? doc.goals : null,
  };
}

function isPremiumPredictionComplete(doc: PremiumPredictionDoc) {
  return Boolean(
    doc.teamA &&
    doc.teamB &&
    typeof doc.scoreA === "number" &&
    typeof doc.scoreB === "number" &&
    (doc.winner === "teamA" || doc.winner === "teamB")
  );
}

function predictionScores(doc: PredictionDoc) {
  if (typeof doc.homeScore === "number" && typeof doc.awayScore === "number") {
    return { homeScore: doc.homeScore, awayScore: doc.awayScore };
  }
  if (typeof doc.mexicoScore === "number" && typeof doc.southAfricaScore === "number") {
    return { homeScore: doc.mexicoScore, awayScore: doc.southAfricaScore };
  }
  return { homeScore: 0, awayScore: 0 };
}

export async function GET() {
  try {
    const db = await getDb();
    const now = new Date();

    const analyticsCollection = db.collection<MundialAnalyticsDoc>(COLLECTIONS.MUNDIAL_ANALYTICS);
    const [
      matches,
      predictions,
      statQuestions,
      statBets,
      rosterPlayers,
      analyticsEvents,
      analyticsCounts,
      analyticsPlayerKeys,
      premiumPlayers,
      premiumPredictions,
    ] = await Promise.all([
      // Also self-heals the bracket: writes decided winners into later rounds
      propagateKnockoutAdvancement<MundialMatchDoc>(db),
      db.collection<PredictionDoc>(PREDICTIONS_COLLECTION).find({}).toArray(),
      db.collection<StatQuestionDoc>(STAT_QUESTIONS_COLLECTION).find({}).sort({ createdAt: 1 }).toArray(),
      db.collection<StatBetDoc>(STAT_BETS_COLLECTION).find({}).toArray(),
      db.collection<RosterPlayerDoc>(ROSTERS_COLLECTION).find({ active: true }).sort({ team: 1, squadNumber: 1 }).toArray(),
      analyticsCollection.find({}).sort({ happenedAt: -1, createdAt: -1 }).limit(ANALYTICS_LIMIT).toArray(),
      analyticsCollection.aggregate<{ _id: MundialAnalyticsEventName; count: number }>([
        { $group: { _id: "$event", count: { $sum: 1 } } },
      ]).toArray(),
      analyticsCollection.distinct("normalizedName"),
      db.collection<PremiumDoc>(COLLECTIONS.MUNDIAL_PREMIUM).find({}).sort({ paidAt: -1 }).toArray(),
      db.collection<PremiumPredictionDoc>(COLLECTIONS.MUNDIAL_PREMIUM_PREDICTIONS).find({}).sort({ playerName: 1, stage: 1, slot: 1 }).toArray(),
    ]);

    const matchesById = new Map(matches.map((m) => [m.id, m]));
    const rostersByTeam = new Map<string, ReturnType<typeof serializeRosterPlayer>[]>();

    for (const player of rosterPlayers) {
      const team = player.team;
      if (!team || !player.name) continue;
      const list = rostersByTeam.get(team) ?? [];
      list.push(serializeRosterPlayer(player));
      rostersByTeam.set(team, list);
    }

    type MatchStat = {
      total: number;
      exactCount: number;
      correctOutcomeCount: number;
      homeWinPicks: number;
      drawPicks: number;
      awayWinPicks: number;
    };

    // Compute leaderboard + per-match prediction stats in one pass
    const playerMap = new Map<
      string,
      {
        playerName: string;
        normalizedName: string;
        predictionPoints: number;
        statPoints: number;
        totalPoints: number;
        totalPredictions: number;
        scoredPredictions: number;
        exactScores: number;
        correctOutcomes: number;
      }
    >();

    const matchStatMap = new Map<string, MatchStat>();

    for (const prediction of predictions) {
      const match = matchesById.get(prediction.matchId);
      const key = prediction.normalizedName;

      if (!playerMap.has(key)) {
        playerMap.set(key, {
          playerName: prediction.playerName,
          normalizedName: key,
          predictionPoints: 0,
          statPoints: 0,
          totalPoints: 0,
          totalPredictions: 0,
          scoredPredictions: 0,
          exactScores: 0,
          correctOutcomes: 0,
        });
      }

      const entry = playerMap.get(key)!;
      entry.totalPredictions++;

      // Per-match stats
      if (!matchStatMap.has(prediction.matchId)) {
        matchStatMap.set(prediction.matchId, {
          total: 0,
          exactCount: 0,
          correctOutcomeCount: 0,
          homeWinPicks: 0,
          drawPicks: 0,
          awayWinPicks: 0,
        });
      }
      const ms = matchStatMap.get(prediction.matchId)!;
      ms.total++;

      const scores = predictionScores(prediction);
      if (scores.homeScore > scores.awayScore) ms.homeWinPicks++;
      else if (scores.homeScore < scores.awayScore) ms.awayWinPicks++;
      else ms.drawPicks++;

      if (
        match &&
        typeof match.homeFinalScore === "number" &&
        typeof match.awayFinalScore === "number"
      ) {
        const scoreResult = computePredictionResult(
          {
            stage: match.stage,
            homeFinalScore: match.homeFinalScore,
            awayFinalScore: match.awayFinalScore,
            homeRegulationScore: match.homeRegulationScore,
            awayRegulationScore: match.awayRegulationScore,
            actualWinner: match.actualWinner,
            decisionMethod: match.decisionMethod,
          },
          { homeScore: scores.homeScore, awayScore: scores.awayScore, winnerPick: prediction.winnerPick, winnerPickMethod: prediction.winnerPickMethod ?? null }
        );
        entry.scoredPredictions++;
        entry.predictionPoints += scoreResult.points;
        if (scoreResult.exactScore) { entry.exactScores++; ms.exactCount++; }
        if (scoreResult.correctOutcome) { entry.correctOutcomes++; ms.correctOutcomeCount++; }
      }
    }

    // Add stat bet points
    for (const bet of statBets) {
      if (!playerMap.has(bet.normalizedName)) {
        playerMap.set(bet.normalizedName, {
          playerName: bet.playerName ?? bet.normalizedName,
          normalizedName: bet.normalizedName,
          predictionPoints: 0,
          statPoints: 0,
          totalPoints: 0,
          totalPredictions: 0,
          scoredPredictions: 0,
          exactScores: 0,
          correctOutcomes: 0,
        });
      }
      const question = statQuestions.find((q) => q.id === bet.questionId);
      if (!question?.correctOptionId || bet.optionId !== question.correctOptionId) continue;
      const entry = playerMap.get(bet.normalizedName);
      if (entry) entry.statPoints += question.pointValue ?? 1;
    }

    for (const entry of playerMap.values()) {
      entry.totalPoints = entry.predictionPoints + entry.statPoints;
    }

    const leaderboard = [...playerMap.values()].sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.exactScores - a.exactScores ||
        b.correctOutcomes - a.correctOutcomes ||
        a.playerName.localeCompare(b.playerName)
    );

    // Format matches for admin view
    const emptyMatchStat: MatchStat = {
      total: 0, exactCount: 0, correctOutcomeCount: 0,
      homeWinPicks: 0, drawPicks: 0, awayWinPicks: 0,
    };
    const adminMatches = matches.map((match) => {
      const ms = matchStatMap.get(match.id) ?? emptyMatchStat;
      const liveStatus = effectiveLiveStatus(match, now.getTime());
      const liveMinute =
        typeof match.liveMinute === "number"
          ? match.liveMinute
          : liveStatus === "live" || liveStatus === "halftime"
            ? autoLiveMinute(match, now.getTime())
            : null;
      return {
        id: match.id,
        number: match.number,
        stage: match.stage,
        stageLabel: match.stageLabel,
        date: match.date,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeSeed: match.homeSeed ?? null,
        awaySeed: match.awaySeed ?? null,
        homeRoster: rostersByTeam.get(match.homeTeam) ?? [],
        awayRoster: rostersByTeam.get(match.awayTeam) ?? [],
        kickoffAt: match.kickoffAt,
        venue: match.venue,
        group: match.group ?? null,
        homeFinalScore: typeof match.homeFinalScore === "number" ? match.homeFinalScore : null,
        awayFinalScore: typeof match.awayFinalScore === "number" ? match.awayFinalScore : null,
        homeRegulationScore: typeof match.homeRegulationScore === "number" ? match.homeRegulationScore : null,
        awayRegulationScore: typeof match.awayRegulationScore === "number" ? match.awayRegulationScore : null,
        forceClosed: match.forceClosed ?? false,
        actualWinner: match.actualWinner ?? null,
        decisionMethod: match.decisionMethod ?? null,
        liveStatus,
        liveMinute,
        liveMinuteUpdatedAt: toIsoString(match.liveMinuteUpdatedAt),
        homeLiveScore: typeof match.homeLiveScore === "number" ? match.homeLiveScore : null,
        awayLiveScore: typeof match.awayLiveScore === "number" ? match.awayLiveScore : null,
        liveNote: match.liveNote ?? "",
        liveEvents: Array.isArray(match.liveEvents) ? match.liveEvents.map(serializeLiveEvent) : [],
        liveStats: serializeLiveMatchStats(match.liveStats),
        liveUpdatedAt: toIsoString(match.liveUpdatedAt),
        bettingFavorite: null,
        closed: isMatchClosed(match, now),
        predictorCount: ms.total,
        exactCount: ms.exactCount,
        correctOutcomeCount: ms.correctOutcomeCount,
        homeWinPicks: ms.homeWinPicks,
        drawPicks: ms.drawPicks,
        awayWinPicks: ms.awayWinPicks,
        sortOrder: match.sortOrder,
      };
    });

    // Format stat questions with per-option bet breakdown
    const adminStatQuestions = statQuestions.map((q) => {
      const questionBets = statBets.filter((b) => b.questionId === q.id);
      const totalBets = questionBets.length;
      const betsByOption = q.options.map((opt) => {
        const picks = questionBets.filter((b) => b.optionId === opt.id);
        return {
          optionId: opt.id,
          label: opt.label,
          count: picks.length,
          pct: totalBets > 0 ? Math.round((picks.length / totalBets) * 100) : 0,
          players: picks.map((b) => b.playerName ?? b.normalizedName),
        };
      });
      return {
        id: q.id,
        matchId: q.matchId,
        matchNumber: q.matchNumber,
        matchLabel: q.matchLabel,
        text: q.text,
        options: q.options,
        correctOptionId: q.correctOptionId ?? null,
        resolved: Boolean(q.correctOptionId),
        pointValue: q.pointValue ?? 1,
        totalBets,
        betsByOption,
      };
    });

    const analyticsCountMap = new Map(analyticsCounts.map((item) => [item._id, item.count]));
    const analytics = {
      summary: {
        totalEvents: analyticsCounts.reduce((sum, item) => sum + item.count, 0),
        logins: analyticsCountMap.get("login") ?? 0,
        picksSaved: analyticsCountMap.get("pick_saved") ?? 0,
        statBetsSaved: analyticsCountMap.get("stat_bet_saved") ?? 0,
        uniquePlayers: analyticsPlayerKeys.filter((key) => typeof key === "string" && key.length > 0).length,
      },
      events: analyticsEvents.map(serializeAnalyticsEvent),
    };

    const predictionsByPlayer = new Map<string, PremiumPredictionDoc[]>();
    for (const prediction of premiumPredictions) {
      const key = prediction.playerKey ?? "";
      if (!key) continue;
      const list = predictionsByPlayer.get(key) ?? [];
      list.push(prediction);
      predictionsByPlayer.set(key, list);
    }

    const premium = {
      players: premiumPlayers.map((player) => {
        const playerKey = player.playerKey ?? "";
        const playerPredictions = predictionsByPlayer.get(playerKey) ?? [];
        const updatedAt = playerPredictions
          .map((prediction) => prediction.updatedAt ? new Date(prediction.updatedAt).getTime() : 0)
          .filter((time) => Number.isFinite(time))
          .sort((a, b) => b - a)[0];

        return {
          playerKey,
          playerName: player.playerName ?? playerKey,
          amountPaid: typeof player.amountPaid === "number" ? player.amountPaid : null,
          currency: player.currency ?? "USD",
          payer: player.payer ?? null,
          paypalOrderId: player.paypalOrderId ?? null,
          paypalCaptureId: player.paypalCaptureId ?? null,
          paidAt: toIsoString(player.paidAt),
          predictionCount: playerPredictions.length,
          completedCount: playerPredictions.filter(isPremiumPredictionComplete).length,
          updatedAt: updatedAt ? new Date(updatedAt).toISOString() : null,
        };
      }),
      predictions: premiumPredictions.map((prediction) => ({
        id: prediction.id ?? `${prediction.playerKey}-${prediction.stage}-${prediction.slot}`,
        playerKey: prediction.playerKey ?? "",
        playerName: prediction.playerName ?? prediction.playerKey ?? "",
        stage: prediction.stage ?? "",
        slot: typeof prediction.slot === "number" ? prediction.slot : 0,
        teamA: prediction.teamA ?? "",
        teamB: prediction.teamB ?? "",
        scoreA: typeof prediction.scoreA === "number" ? prediction.scoreA : null,
        scoreB: typeof prediction.scoreB === "number" ? prediction.scoreB : null,
        winner: prediction.winner ?? "",
        confidence: typeof prediction.confidence === "number" ? prediction.confidence : null,
        note: prediction.note ?? "",
        updatedAt: toIsoString(prediction.updatedAt),
      })),
    };

    return NextResponse.json({ matches: adminMatches, leaderboard, statQuestions: adminStatQuestions, premium, analytics });
  } catch (error) {
    console.error("Failed to load admin data", error);
    return NextResponse.json({ error: "No se pudo cargar el panel de admin." }, { status: 500 });
  }
}
