import { NextRequest, NextResponse } from "next/server";

import {
  getScoresDb,
  SCORES_COLLECTIONS,
  ensureScoresData,
  requireAdmin,
  isAdminResult,
  cleanText,
  type MatchDoc,
} from "@/lib/scores";

export const dynamic = "force-dynamic";

type ModelPredictionDoc = {
  matchId: string;
  modelVersion: string;
  probabilities: { home: number; draw: number; away: number };
  predictedScore?: { home: number; away: number } | null;
  explanation?: string;
  generatedAt: Date;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function featureEnabled() {
  return process.env.SCORES_MODEL_PREDICTIONS_ENABLED === "true";
}

export async function GET(req: NextRequest) {
  if (!featureEnabled()) {
    return NextResponse.json({ enabled: false, predictions: [] });
  }

  try {
    const db = await getScoresDb();
    await ensureScoresData(db);
    const matchId = cleanText(req.nextUrl.searchParams.get("matchId"), 100);
    const filter: Record<string, unknown> = { enabled: true };
    if (matchId) filter.matchId = matchId;
    const docs = await db
      .collection<ModelPredictionDoc>(SCORES_COLLECTIONS.MODEL_PREDICTIONS)
      .find(filter)
      .sort({ generatedAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      enabled: true,
      predictions: docs.map((doc) => ({
        matchId: doc.matchId,
        modelVersion: doc.modelVersion,
        probabilities: doc.probabilities,
        predictedScore: doc.predictedScore ?? null,
        explanation: doc.explanation ?? "",
        generatedAt: doc.generatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[scores/model-predictions GET]", error);
    return NextResponse.json({ error: "No se pudieron cargar predicciones." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = requireAdmin(req);
  if (isAdminResult(admin)) return admin;

  try {
    const body = await req.json();
    const matchId = cleanText(body.matchId, 100);
    const modelVersion = cleanText(body.modelVersion, 80);
    const home = Number(body.probabilities?.home);
    const draw = Number(body.probabilities?.draw);
    const away = Number(body.probabilities?.away);
    const probabilities = [home, draw, away];
    if (
      !matchId ||
      !modelVersion ||
      probabilities.some((value) => !Number.isFinite(value) || value < 0 || value > 1) ||
      Math.abs(home + draw + away - 1) > 0.001
    ) {
      return NextResponse.json({ error: "Prediccion de modelo invalida." }, { status: 400 });
    }

    const db = await getScoresDb();
    await ensureScoresData(db);
    const match = await db
      .collection<MatchDoc>(SCORES_COLLECTIONS.MATCHES)
      .findOne({ id: matchId });
    if (!match) return NextResponse.json({ error: "Partido no encontrado." }, { status: 404 });

    const score =
      Number.isInteger(body.predictedScore?.home) && Number.isInteger(body.predictedScore?.away)
        ? {
            home: Number(body.predictedScore.home),
            away: Number(body.predictedScore.away),
          }
        : null;
    const now = new Date();
    await db.collection<ModelPredictionDoc>(SCORES_COLLECTIONS.MODEL_PREDICTIONS).updateOne(
      { matchId, modelVersion },
      {
        $set: {
          matchId,
          modelVersion,
          probabilities: { home, draw, away },
          predictedScore: score,
          explanation: cleanText(body.explanation, 400),
          generatedAt: now,
          enabled: Boolean(body.enabled),
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
    return NextResponse.json({ ok: true, publicFeatureEnabled: featureEnabled() });
  } catch (error) {
    console.error("[scores/model-predictions POST]", error);
    return NextResponse.json({ error: "No se pudo guardar la prediccion." }, { status: 500 });
  }
}
