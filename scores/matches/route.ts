import { NextRequest, NextResponse } from "next/server";

import {
  getScoresDb,
  readMatches,
  readCompetitions,
  serializeMatch,
  type Sport,
} from "@/lib/scores";

export const dynamic = "force-dynamic";

function parseDate(value: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function decodeCursor(value: string | null) {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!Number.isFinite(parsed.sortOrder) || typeof parsed.id !== "string") return null;
    return { sortOrder: Number(parsed.sortOrder), id: parsed.id };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const competitionId = searchParams.get("competitionId") || searchParams.get("sourceId") || undefined;
    const sport = (searchParams.get("sport") as Sport) || undefined;
    const status = searchParams.get("status") || undefined;
    const liveOnly = searchParams.get("live") === "1";
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || 50) || 50));
    const dateFrom = parseDate(searchParams.get("dateFrom"));
    const dateTo = parseDate(searchParams.get("dateTo"));
    const cursor = decodeCursor(searchParams.get("cursor"));
    if (dateFrom === null || dateTo === null || cursor === null) {
      return NextResponse.json({ error: "Filtros de fecha o cursor invalidos." }, { status: 400 });
    }

    const db = await getScoresDb();
    const [docs, competitions] = await Promise.all([
      readMatches(db, {
        competitionId,
        sport,
        status,
        liveOnly,
        limit: limit + 1,
        dateFrom,
        dateTo,
        cursor,
      }),
      readCompetitions(db),
    ]);
    const now = new Date();
    const hasMore = docs.length > limit;
    const page = docs.slice(0, limit);
    const last = page.at(-1);
    const nextCursor =
      hasMore && last
        ? Buffer.from(
            JSON.stringify({ sortOrder: last.sortOrder ?? last.number, id: last.id }),
            "utf8"
          ).toString("base64url")
        : null;

    return NextResponse.json({
      competitions: competitions.map((c) => ({
        id: c.id,
        name: c.name,
        sport: c.sport,
        syncHealth: c.syncHealth,
      })),
      matches: page.map((d) => serializeMatch(d, now)),
      nextCursor,
      serverTime: now.toISOString(),
    });
  } catch (error) {
    console.error("[scores/matches]", error);
    return NextResponse.json({ error: "No se pudieron cargar partidos." }, { status: 500 });
  }
}
