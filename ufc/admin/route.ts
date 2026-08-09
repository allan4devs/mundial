import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/helpers/mongodb";
import type { UfcFight } from "@/lib/ufc/fights";

export const dynamic = "force-dynamic";

const FIGHTS_COLLECTION = "ufc_fights";
const PREDICTIONS_COLLECTION = "ufc_predictions";

type CornerPick = "red" | "blue" | null;
type MethodPick = "ko_tko" | "submission" | "decision" | null;

type UfcFightDoc = UfcFight & {
  forceClosed?: boolean;
  liveStatus?: "scheduled" | "live" | "finished";
  liveNote?: string;
};

type PredictionDoc = {
  _id: ObjectId;
  fightId: string;
  playerName: string;
  normalizedName: string;
  cornerPick?: CornerPick;
  methodPick?: MethodPick;
  updatedAt?: Date;
};

function scheduledTime(fight: UfcFightDoc | UfcFight) {
  const t = new Date(fight.scheduledAt).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

function isFightClosed(fight: UfcFightDoc | UfcFight, now: Date) {
  if ((fight as UfcFightDoc).forceClosed) return true;
  return scheduledTime(fight) <= now.getTime();
}

function computePoints(fight: UfcFightDoc, pred: { cornerPick?: CornerPick; methodPick?: MethodPick }): number {
  if (!fight.winnerCorner) return 0;
  if (pred.cornerPick !== fight.winnerCorner) return 0;
  const correctMethod = fight.method != null && pred.methodPick === fight.method;
  return correctMethod ? 2 : 1;
}

export async function GET() {
  try {
    const db = await getDb();
    const now = new Date();

    const [fights, predictions] = await Promise.all([
      db.collection<UfcFightDoc>(FIGHTS_COLLECTION).find({}).sort({ sortOrder: 1 }).toArray(),
      db.collection<PredictionDoc>(PREDICTIONS_COLLECTION).find({}).toArray(),
    ]);

    const fightsById = new Map(fights.map((f) => [f.id, f]));

    type FightStat = {
      total: number;
      redPicks: number;
      bluePicks: number;
      ko_tkoPicks: number;
      submissionPicks: number;
      decisionPicks: number;
    };

    const playerMap = new Map<string, {
      playerName: string;
      normalizedName: string;
      totalPoints: number;
      totalPredictions: number;
      scoredPredictions: number;
      exactPicks: number;
      correctWinners: number;
    }>();

    const fightStatMap = new Map<string, FightStat>();

    for (const pred of predictions) {
      const fight = fightsById.get(pred.fightId);
      const key = pred.normalizedName;

      if (!playerMap.has(key)) {
        playerMap.set(key, {
          playerName: pred.playerName,
          normalizedName: key,
          totalPoints: 0,
          totalPredictions: 0,
          scoredPredictions: 0,
          exactPicks: 0,
          correctWinners: 0,
        });
      }

      const entry = playerMap.get(key)!;
      entry.totalPredictions++;

      if (!fightStatMap.has(pred.fightId)) {
        fightStatMap.set(pred.fightId, { total: 0, redPicks: 0, bluePicks: 0, ko_tkoPicks: 0, submissionPicks: 0, decisionPicks: 0 });
      }
      const ms = fightStatMap.get(pred.fightId)!;
      ms.total++;
      if (pred.cornerPick === "red") ms.redPicks++;
      else if (pred.cornerPick === "blue") ms.bluePicks++;
      if (pred.methodPick === "ko_tko") ms.ko_tkoPicks++;
      else if (pred.methodPick === "submission") ms.submissionPicks++;
      else if (pred.methodPick === "decision") ms.decisionPicks++;

      if (fight && fight.winnerCorner) {
        const pts = computePoints(fight, pred);
        entry.scoredPredictions++;
        entry.totalPoints += pts;
        if (pts >= 1) entry.correctWinners++;
        if (pts >= 2) entry.exactPicks++;
      }
    }

    const leaderboard = [...playerMap.values()].sort(
      (a, b) => b.totalPoints - a.totalPoints || a.playerName.localeCompare(b.playerName)
    );

    const emptyFightStat: FightStat = { total: 0, redPicks: 0, bluePicks: 0, ko_tkoPicks: 0, submissionPicks: 0, decisionPicks: 0 };

    const adminFights = fights.map((fight) => {
      const ms = fightStatMap.get(fight.id) ?? emptyFightStat;
      return {
        id: fight.id,
        number: fight.number,
        section: fight.section,
        sectionLabel: fight.sectionLabel,
        weightClass: fight.weightClass,
        weightLbs: fight.weightLbs,
        titleFight: fight.titleFight,
        titleLabel: fight.titleLabel ?? null,
        scheduledRounds: fight.scheduledRounds,
        redCorner: fight.redCorner,
        blueCorner: fight.blueCorner,
        scheduledAt: fight.scheduledAt,
        venue: fight.venue,
        winnerCorner: fight.winnerCorner ?? null,
        method: fight.method ?? null,
        endRound: fight.endRound ?? null,
        endTime: fight.endTime ?? null,
        liveStatus: fight.liveStatus ?? "scheduled",
        liveNote: fight.liveNote ?? "",
        forceClosed: fight.forceClosed ?? false,
        closed: isFightClosed(fight, now),
        predictorCount: ms.total,
        redPicks: ms.redPicks,
        bluePicks: ms.bluePicks,
        ko_tkoPicks: ms.ko_tkoPicks,
        submissionPicks: ms.submissionPicks,
        decisionPicks: ms.decisionPicks,
      };
    });

    return NextResponse.json({ fights: adminFights, leaderboard });
  } catch (error) {
    console.error("Failed to load UFC admin data", error);
    return NextResponse.json({ error: "No se pudo cargar el panel de admin." }, { status: 500 });
  }
}
