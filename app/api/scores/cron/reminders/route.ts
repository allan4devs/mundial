import { NextRequest, NextResponse } from "next/server";

import {
  getScoresDb,
  SCORES_COLLECTIONS,
  ensureScoresData,
  type MatchDoc,
  type ScoresIdentityDoc,
} from "@/lib/scores";

export const dynamic = "force-dynamic";

async function queueReminders(req: NextRequest) {
  const secret = process.env.SCORES_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Cron secret not configured." }, { status: 503 });
  }
  const header =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    req.headers.get("x-scores-cron-secret") ||
    "";
  if (header !== secret) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const db = await getScoresDb();
    await ensureScoresData(db);
    const now = new Date();
    const windowStart = new Date(now.getTime() + 30 * 60_000);
    const windowEnd = new Date(now.getTime() + 90 * 60_000);
    const [matches, identities] = await Promise.all([
      db
        .collection<MatchDoc>(SCORES_COLLECTIONS.MATCHES)
        .find({
          status: "scheduled",
          predictionClosesAt: { $gte: windowStart, $lte: windowEnd },
        })
        .toArray(),
      db
        .collection<ScoresIdentityDoc>(SCORES_COLLECTIONS.IDENTITIES)
        .find({
          notificationEmailVerifiedAt: { $ne: null },
          notificationConsentAt: { $ne: null },
          "preferences.pickClosingReminder": true,
        })
        .toArray(),
    ]);

    if (!matches.length || !identities.length) {
      return NextResponse.json({ ok: true, queued: 0, reason: "no eligible reminders" });
    }

    const operations = identities.flatMap((identity) =>
      matches.map((match) => ({
        updateOne: {
          filter: {
            userId: identity._id.toString(),
            matchId: match.id,
            type: "pick_closing",
          },
          update: {
            $setOnInsert: {
              userId: identity._id.toString(),
              matchId: match.id,
              type: "pick_closing",
              status: "pending",
              scheduledFor: new Date(match.predictionClosesAt.getTime() - 30 * 60_000),
              createdAt: now,
            },
          },
          upsert: true,
        },
      }))
    );
    const result = await db
      .collection(SCORES_COLLECTIONS.NOTIFICATION_DELIVERIES)
      .bulkWrite(operations, { ordered: false });

    return NextResponse.json({ ok: true, queued: result.upsertedCount });
  } catch (error) {
    console.error("[scores/cron/reminders]", error);
    return NextResponse.json({ error: "Reminder queue failed." }, { status: 500 });
  }
}

export const GET = queueReminders;
export const POST = queueReminders;
