import { NextRequest, NextResponse } from "next/server";

import {
  getScoresDb,
  SCORES_COLLECTIONS,
  ensureScoresData,
  ensureIdentityIndexes,
  readViewer,
  SCORES_ACHIEVEMENTS,
  recordScoresAnalyticsEvent,
} from "@/lib/scores";

export const dynamic = "force-dynamic";

type AchievementDoc = {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
};

export async function GET(req: NextRequest) {
  try {
    const db = await getScoresDb();
    await Promise.all([ensureScoresData(db), ensureIdentityIndexes(db)]);
    const viewer = await readViewer(db, req);
    if (!viewer) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const predictions = await db
      .collection(SCORES_COLLECTIONS.PREDICTIONS)
      .find({ userId: viewer.userId })
      .project<{ scoring?: { exact?: boolean; correctOutcome?: boolean; ruleVersion?: string } }>({
        scoring: 1,
      })
      .toArray();
    const scored = predictions.filter(
      (prediction) =>
        prediction.scoring &&
        prediction.scoring.ruleVersion !== "pending" &&
        prediction.scoring.ruleVersion !== "void"
    );
    const exact = scored.filter((prediction) => prediction.scoring?.exact).length;
    const correct = scored.filter((prediction) => prediction.scoring?.correctOutcome).length;

    const unlockedIds = [
      ...(predictions.length >= 1 ? ["first-pick"] : []),
      ...(exact >= 1 ? ["first-exact"] : []),
      ...(correct >= 5 ? ["five-correct"] : []),
    ];
    const now = new Date();
    for (const achievementId of unlockedIds) {
      const result = await db
        .collection<AchievementDoc>(SCORES_COLLECTIONS.USER_ACHIEVEMENTS)
        .updateOne(
          { userId: viewer.userId, achievementId },
          { $setOnInsert: { userId: viewer.userId, achievementId, unlockedAt: now } },
          { upsert: true }
        );
      if (result.upsertedCount) {
        await recordScoresAnalyticsEvent(
          db,
          "achievement_unlocked",
          viewer.userId,
          { achievementId }
        ).catch((error) => console.error("[scores/analytics achievement]", error));
      }
    }

    const docs = await db
      .collection<AchievementDoc>(SCORES_COLLECTIONS.USER_ACHIEVEMENTS)
      .find({ userId: viewer.userId })
      .toArray();
    const byId = new Map(docs.map((doc) => [doc.achievementId, doc]));

    return NextResponse.json({
      achievements: SCORES_ACHIEVEMENTS.map((achievement) => ({
        ...achievement,
        unlockedAt: byId.get(achievement.id)?.unlockedAt.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error("[scores/achievements]", error);
    return NextResponse.json({ error: "No se pudieron cargar los logros." }, { status: 500 });
  }
}
