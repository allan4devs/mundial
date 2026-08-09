import { NextRequest, NextResponse } from "next/server";

import { getScoresDb, ensureScoresData, ensureIdentityIndexes } from "@/lib/scores";
import { PredictionsError, savePredictionForViewer } from "@/lib/scores/predictions-service";

export const dynamic = "force-dynamic";

/** PUT /api/scores/predictions/:matchId — canonical write from plan */
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await ctx.params;
    const body = await req.json();
    const db = await getScoresDb();
    await ensureScoresData(db);
    await ensureIdentityIndexes(db);

    const result = await savePredictionForViewer(db, req, {
      matchId,
      homeScore: body.homeScore,
      awayScore: body.awayScore,
      expectedUpdatedAt: body.expectedUpdatedAt,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PredictionsError) {
      return NextResponse.json(
        { error: error.message, ...error.extra },
        { status: error.status }
      );
    }
    console.error("[scores/predictions PUT]", error);
    return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 });
  }
}
