import { NextRequest, NextResponse } from "next/server";

import {
  getScoresDb,
  requireAdmin,
  isAdminResult,
  writeAdminAudit,
  syncCompetition,
  markStaleCompetitions,
  cleanText,
} from "@/lib/scores";

export const dynamic = "force-dynamic";

/** POST { competitionId } — run provider sync */
export async function POST(req: NextRequest) {
  const admin = requireAdmin(req);
  if (isAdminResult(admin)) return admin;

  try {
    const body = await req.json().catch(() => ({}));
    const competitionId = cleanText(body.competitionId, 40);
    if (!competitionId) {
      return NextResponse.json({ error: "competitionId requerido." }, { status: 400 });
    }

    const db = await getScoresDb();
    await markStaleCompetitions(db);
    const result = await syncCompetition(db, competitionId);

    await writeAdminAudit(db, {
      adminId: admin.id,
      adminUsername: admin.username,
      action: "sync",
      after: result,
      source: "provider",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[scores/admin/sync]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync fallido." },
      { status: 500 }
    );
  }
}
