import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/helpers/mongodb";
import type { MundialMatch } from "@/lib/mundial/fixtures";
import { readMundialMatches } from "@/lib/mundial/matches-store";
import { computePredictionResult } from "@/lib/mundial/prediction-scoring";

export const dynamic = "force-dynamic";

const PREDICTIONS_COLLECTION = "mundial_predictions";
const STAT_QUESTIONS_COLLECTION = "mundial_stat_questions";
const STAT_BETS_COLLECTION = "mundial_stat_bets";

type WinnerPick = "home" | "away" | null;
type MatchDecisionMethod = "regular" | "extraTime" | "penalties";

type MundialMatchDoc = MundialMatch & {
  forceClosed?: boolean;
  actualWinner?: WinnerPick;
  decisionMethod?: MatchDecisionMethod;
  homeRegulationScore?: number;
  awayRegulationScore?: number;
  homeFinalScore?: number;
  awayFinalScore?: number;
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
  updatedAt?: Date;
};

type StatQuestionDoc = {
  id: string;
  matchId: string;
  matchNumber?: number;
  matchLabel?: string;
  text: string;
  options?: Array<{ id: string; label?: string; text?: string }>;
  correctOptionId?: string | null;
  pointValue?: number;
};

type StatBetDoc = {
  questionId: string;
  normalizedName: string;
  optionId: string;
};

function kickoffTime(match: MundialMatchDoc) {
  const t = new Date(match.kickoffAt).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

function isMatchClosed(match: MundialMatchDoc, now: Date) {
  if (match.forceClosed) return true;
  return kickoffTime(match) <= now.getTime();
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

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  try {
    const db = await getDb();
    const now = new Date();

    const [matches, predictions, statQuestions, statBets] = await Promise.all([
      readMundialMatches<MundialMatchDoc>(db),
      db.collection<PredictionDoc>(PREDICTIONS_COLLECTION).find({ normalizedName: name }).toArray(),
      db.collection<StatQuestionDoc>(STAT_QUESTIONS_COLLECTION).find({}).sort({ createdAt: 1 }).toArray(),
      db.collection<StatBetDoc>(STAT_BETS_COLLECTION).find({ normalizedName: name }).toArray(),
    ]);

    const predictionsByMatch = new Map(predictions.map((prediction) => [prediction.matchId, prediction]));

    const details = matches
      .filter(
        (match) =>
          predictionsByMatch.has(match.id) ||
          (typeof match.homeFinalScore === "number" && typeof match.awayFinalScore === "number")
      )
      .map((match) => {
        const pred = predictionsByMatch.get(match.id);
        const hasPrediction = Boolean(pred);

        const scores = pred ? predictionScores(pred) : null;
        const closed = isMatchClosed(match, now);

        let points: number | null = null;
        let isExact = false;
        let correctOutcome = false;

        if (
          typeof match.homeFinalScore === "number" &&
          typeof match.awayFinalScore === "number" &&
          pred &&
          scores
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
            { homeScore: scores.homeScore, awayScore: scores.awayScore, winnerPick: pred.winnerPick, winnerPickMethod: pred.winnerPickMethod ?? null }
          );
          points = scoreResult.points;
          isExact = scoreResult.exactScore;
          correctOutcome = scoreResult.correctOutcome;
        }

        return {
          matchId: match.id,
          matchNumber: match.number,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          kickoffAt: match.kickoffAt,
          stage: match.stage,
          stageLabel: match.stageLabel,
          homeFinalScore: typeof match.homeFinalScore === "number" ? match.homeFinalScore : null,
          awayFinalScore: typeof match.awayFinalScore === "number" ? match.awayFinalScore : null,
          homeRegulationScore: typeof match.homeRegulationScore === "number" ? match.homeRegulationScore : null,
          awayRegulationScore: typeof match.awayRegulationScore === "number" ? match.awayRegulationScore : null,
          decisionMethod: match.decisionMethod ?? null,
          actualWinner: match.actualWinner ?? null,
          hasPrediction,
          predictedHome: scores?.homeScore ?? null,
          predictedAway: scores?.awayScore ?? null,
          winnerPick: pred?.winnerPick ?? null,
          winnerPickMethod: pred?.winnerPickMethod ?? null,
          points,
          isExact,
          correctOutcome,
          closed,
        };
      })
      .sort((a, b) => a.matchNumber - b.matchNumber);

    const questionsById = new Map(statQuestions.map((question) => [question.id, question]));
    const statDetails = statBets
      .map((bet) => {
        const question = questionsById.get(bet.questionId);
        if (!question) return null;
        const pickedOption = question.options?.find((option) => option.id === bet.optionId);
        const correctOption = question.options?.find((option) => option.id === question.correctOptionId);
        const resolved = Boolean(question.correctOptionId);
        const correct = resolved && bet.optionId === question.correctOptionId;
        const pointValue = question.pointValue ?? 1;

        return {
          questionId: question.id,
          matchId: question.matchId,
          matchNumber: question.matchNumber ?? null,
          matchLabel: question.matchLabel ?? "",
          question: question.text,
          pickedOption: pickedOption?.label ?? pickedOption?.text ?? bet.optionId,
          correctOption: correctOption?.label ?? correctOption?.text ?? null,
          resolved,
          correct,
          points: correct ? pointValue : 0,
        };
      })
      .filter((detail): detail is NonNullable<typeof detail> => detail !== null)
      .sort((a, b) => (a.matchNumber ?? Number.MAX_SAFE_INTEGER) - (b.matchNumber ?? Number.MAX_SAFE_INTEGER));

    const predictionPoints = details.reduce((sum, detail) => sum + (detail.points ?? 0), 0);
    const statPoints = statDetails.reduce((sum, detail) => sum + detail.points, 0);

    const playerName = predictions[0]?.playerName ?? name;

    return NextResponse.json({
      playerName,
      predictions: details,
      statBets: statDetails,
      audit: {
        predictionPoints,
        statPoints,
        totalPoints: predictionPoints + statPoints,
      },
    });
  } catch (error) {
    console.error("Failed to load player detail", error);
    return NextResponse.json({ error: "No se pudo cargar el detalle del jugador." }, { status: 500 });
  }
}
