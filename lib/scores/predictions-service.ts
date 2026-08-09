import type { Db } from "mongodb";
import type { NextRequest } from "next/server";

import { SCORES_COLLECTIONS } from "./db";
import { isMatchClosed, type MatchDoc } from "./store";
import { parseScore } from "./validators";
import { readViewer } from "./identity";
import { recordScoresAnalyticsEvent } from "./growth";

export class PredictionsError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly extra?: Record<string, unknown>
  ) {
    super(message);
  }
}

export async function savePredictionForViewer(
  db: Db,
  req: NextRequest,
  input: {
    matchId: string;
    homeScore: unknown;
    awayScore: unknown;
    expectedUpdatedAt?: unknown;
  }
) {
  const viewer = await readViewer(db, req);
  if (!viewer) throw new PredictionsError("Inicia sesion para guardar picks.", 401);

  const matchId = String(input.matchId ?? "").trim();
  if (!matchId) throw new PredictionsError("matchId requerido.");
  const session = db.client.startSession();
  let saved:
    | { ok: true; matchId: string; homeScore: number; awayScore: number; updatedAt: string }
    | undefined;

  try {
    await session.withTransaction(async () => {
      const matches = db.collection<MatchDoc>(SCORES_COLLECTIONS.MATCHES);
      const predictions = db.collection(SCORES_COLLECTIONS.PREDICTIONS);
      const match = await matches.findOne({ id: matchId }, { session });
      if (!match) throw new PredictionsError("Partido no encontrado.", 404);
      if (isMatchClosed(match, new Date())) {
        throw new PredictionsError("Partido cerrado para predicciones.");
      }
      if (match.status === "cancelled") {
        throw new PredictionsError("Partido cancelado.");
      }

      const homeScore = parseScore(input.homeScore, match.sport);
      const awayScore = parseScore(input.awayScore, match.sport);
      if (homeScore === null || awayScore === null) {
        throw new PredictionsError("Marcador invalido para este deporte.");
      }

      // This write serializes pick submissions through the match document and
      // asks MongoDB's clock to enforce the cutoff inside the transaction.
      const gate = await matches.updateOne(
        {
          id: matchId,
          forceClosed: { $ne: true },
          status: { $nin: ["finished", "cancelled"] },
          $expr: {
            $gt: [
              { $ifNull: ["$predictionClosesAt", "$startsAt"] },
              "$$NOW",
            ],
          },
        },
        [
          {
            $set: {
              predictionGateVersion: {
                $add: [{ $ifNull: ["$predictionGateVersion", 0] }, 1],
              },
              predictionGateCheckedAt: "$$NOW",
            },
          },
        ],
        { session }
      );
      if (gate.matchedCount !== 1) {
        throw new PredictionsError("Partido cerrado para predicciones.");
      }

      const now = new Date();
      const update = {
        $set: {
          matchId,
          userId: viewer.userId,
          displayNameSnapshot: viewer.displayName,
          playerName: viewer.displayName,
          homeScore,
          awayScore,
          predictedScore: { home: homeScore, away: awayScore },
          locked: false,
          lockedAt: null,
          scoring: null,
          scoredResultVersion: null,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      };

      if (input.expectedUpdatedAt) {
        const expected = new Date(String(input.expectedUpdatedAt));
        if (Number.isNaN(expected.getTime())) {
          throw new PredictionsError("Version de pick invalida.", 409, { conflict: true });
        }
        const result = await predictions.updateOne(
          { matchId, userId: viewer.userId, updatedAt: expected },
          update,
          { session }
        );
        if (result.matchedCount !== 1) {
          throw new PredictionsError("Pick desactualizado. Recarga e intenta de nuevo.", 409, {
            conflict: true,
          });
        }
      } else {
        await predictions.updateOne(
          { matchId, userId: viewer.userId },
          update,
          { upsert: true, session }
        );
      }

      saved = {
        ok: true,
        matchId,
        homeScore,
        awayScore,
        updatedAt: now.toISOString(),
      };
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new PredictionsError("Pick desactualizado. Recarga e intenta de nuevo.", 409, {
        conflict: true,
      });
    }
    throw error;
  } finally {
    await session.endSession();
  }

  if (!saved) throw new PredictionsError("No se pudo guardar.", 500);
  await recordScoresAnalyticsEvent(db, "pick_saved", viewer.userId, { matchId }).catch(
    (error) => console.error("[scores/analytics pick_saved]", error)
  );
  return saved;
}
