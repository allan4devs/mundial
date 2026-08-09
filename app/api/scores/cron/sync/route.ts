import { NextRequest, NextResponse } from "next/server";

import {
  getScoresDb,
  readCompetitions,
  syncCompetition,
  markStaleCompetitions,
  writeAdminAudit,
} from "@/lib/scores";

export const dynamic = "force-dynamic";

/**
 * Protected bulk sync for provider competitions.
 * Header: Authorization: Bearer $SCORES_CRON_SECRET  (or x-scores-cron-secret)
 */
async function runSync(req: NextRequest) {
  const secret = process.env.SCORES_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "SCORES_CRON_SECRET not configured." }, { status: 503 });
  }

  const header =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    req.headers.get("x-scores-cron-secret") ||
    "";
  if (header !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const db = await getScoresDb();
    await markStaleCompetitions(db);
    const competitions = await readCompetitions(db, true);
    const targets = competitions.filter((c) => c.enabled && c.syncMode === "provider");

    const results: Array<{ id: string; ok: boolean; upserted?: number; error?: string }> = [];
    for (const c of targets) {
      try {
        const r = await syncCompetition(db, c.id);
        results.push({ id: c.id, ok: true, upserted: r.upserted });
        await writeAdminAudit(db, {
          adminId: "scores-cron",
          adminUsername: "scores-cron",
          action: "sync.cron",
          after: { competitionId: c.id, ...r },
          source: "provider",
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "fail";
        results.push({
          id: c.id,
          ok: false,
          error: message,
        });
        await writeAdminAudit(db, {
          adminId: "scores-cron",
          adminUsername: "scores-cron",
          action: "sync.cron.error",
          after: { competitionId: c.id, error: message },
          source: "provider",
        });
      }
    }

    const failed = results.filter((result) => !result.ok).length;
    return NextResponse.json(
      {
        ok: failed === 0,
        ran: results.length,
        failed,
        results,
        at: new Date().toISOString(),
      },
      { status: failed > 0 ? 502 : 200 }
    );
  } catch (error) {
    console.error("[scores/cron/sync]", error);
    return NextResponse.json({ error: "Cron sync failed." }, { status: 500 });
  }
}

export const GET = runSync;
export const POST = runSync;
