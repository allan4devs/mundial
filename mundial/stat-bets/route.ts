import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import { recordMundialAnalyticsEvent } from "@/lib/mundial/analytics";
import { readMundialMatches } from "@/lib/mundial/matches-store";
import { identitySessionMatches } from "@/lib/mundial/identity";

export const dynamic = "force-dynamic";

const STAT_QUESTIONS_COLLECTION = "mundial_stat_questions";
const STAT_BETS_COLLECTION = "mundial_stat_bets";

type StatBetOption = {
  id: string;
  text?: string;
  label?: string;
};

function normalizeName(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}
function normalizeKey(value: string) {
  return value.trim().toUpperCase();
}

export async function GET(req: NextRequest) {
  try {
    const matchId = req.nextUrl.searchParams.get("matchId") ?? "";
    const playerName = normalizeName(req.nextUrl.searchParams.get("playerName"));
    const global = req.nextUrl.searchParams.get("global") === "true";

    // Global leaderboard: aggregate stat-bet points across all matches
    if (global) {
      const db = await getDb();
      const [questions, allBets] = await Promise.all([
        db.collection(STAT_QUESTIONS_COLLECTION).find({}).toArray(),
        db.collection(STAT_BETS_COLLECTION).find({}).toArray(),
      ]);

      const playerMap = new Map<string, { playerName: string; earned: number; total: number }>();
      for (const bet of allBets) {
        const key = String(bet.normalizedName ?? "");
        if (!key) continue;
        if (!playerMap.has(key)) {
          playerMap.set(key, { playerName: String(bet.playerName ?? key), earned: 0, total: 0 });
        }
        const entry = playerMap.get(key)!;
        entry.total++;
        const q = questions.find((q) => q.id === bet.questionId);
        if (q?.correctOptionId && bet.optionId === q.correctOptionId) {
          entry.earned += Number(q.pointValue ?? 1);
        }
      }

      const leaderboard = [...playerMap.values()].sort(
        (a, b) => b.earned - a.earned || b.total - a.total || a.playerName.localeCompare(b.playerName)
      );

      return NextResponse.json({ leaderboard });
    }

    if (!matchId) {
      return NextResponse.json({ error: "matchId requerido." }, { status: 400 });
    }

    const db = await getDb();

    const [questions, myBets, allMatchBets] = await Promise.all([
      db.collection(STAT_QUESTIONS_COLLECTION).find({ matchId }).sort({ createdAt: 1 }).toArray(),
      playerName
        ? db.collection(STAT_BETS_COLLECTION).find({ matchId, normalizedName: normalizeKey(playerName) }).toArray()
        : Promise.resolve([]),
      db.collection(STAT_BETS_COLLECTION).find({ matchId }).toArray(),
    ]);

    // Build per-player leaderboard for this match
    const playerMap = new Map<string, { playerName: string; earned: number; total: number }>();
    for (const bet of allMatchBets) {
      const key = String(bet.normalizedName ?? "");
      if (!key) continue;
      if (!playerMap.has(key)) {
        playerMap.set(key, { playerName: String(bet.playerName ?? key), earned: 0, total: 0 });
      }
      const entry = playerMap.get(key)!;
      entry.total++;
      const q = questions.find((q) => q.id === bet.questionId);
      if (q?.correctOptionId && bet.optionId === q.correctOptionId) {
        entry.earned += Number(q.pointValue ?? 1);
      }
    }
    const leaderboard = [...playerMap.values()].sort(
      (a, b) => b.earned - a.earned || b.total - a.total || a.playerName.localeCompare(b.playerName)
    );

    return NextResponse.json({
      questions: questions.map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        optionStats: ((q.options ?? []) as StatBetOption[]).map((option) => {
          const bets = allMatchBets.filter((bet) => bet.questionId === q.id && bet.optionId === option.id);
          return {
            optionId: option.id,
            label: option.label ?? option.text ?? option.id,
            count: bets.length,
            players: bets.map((bet) => String(bet.playerName ?? bet.normalizedName ?? "")).filter(Boolean),
          };
        }),
        correctOptionId: q.correctOptionId ?? null,
        resolved: Boolean(q.correctOptionId),
        pointValue: q.pointValue ?? 1,
        closed: Boolean(q.closed || q.closedAt),
      })),
      myBets: myBets.map((b) => ({
        questionId: b.questionId,
        optionId: b.optionId,
      })),
      leaderboard,
    });
  } catch (error) {
    console.error("Failed to load stat bets", error);
    return NextResponse.json({ error: "No se pudo cargar las apuestas." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionId, matchId, playerName: rawName, optionId } = body;

    const playerName = normalizeName(rawName);
    const normalizedName = normalizeKey(playerName);

    if (!questionId || !matchId || !playerName || !optionId) {
      return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
    }

    const db = await getDb();
    if (!(await identitySessionMatches(db, req, playerName))) {
      return NextResponse.json({ error: "Sesión inválida. Verificá tu cédula y PIN nuevamente." }, { status: 401 });
    }
    const matches = await readMundialMatches(db);
    const match = matches.find((m) => m.id === matchId);
    if (!match) {
      return NextResponse.json({ error: "Partido no encontrado." }, { status: 404 });
    }

    const question = await db.collection(STAT_QUESTIONS_COLLECTION).findOne({ id: questionId, matchId });

    if (!question) {
      return NextResponse.json({ error: "Pregunta no encontrada para este partido." }, { status: 404 });
    }
    if (question.correctOptionId) {
      return NextResponse.json({ error: "Esta pregunta ya fue resuelta." }, { status: 423 });
    }
    if (question.closed || question.closedAt) {
      return NextResponse.json({ error: "Esta pregunta esta cerrada." }, { status: 423 });
    }

    const validOption = (question.options as StatBetOption[] | undefined)?.find((o) => o.id === optionId);
    if (!validOption) {
      return NextResponse.json({ error: "Opcion invalida." }, { status: 400 });
    }

    const now = new Date();
    await db.collection(STAT_BETS_COLLECTION).updateOne(
      { questionId, normalizedName },
      {
        $set: { questionId, matchId, playerName, normalizedName, optionId, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    await recordMundialAnalyticsEvent(db, req, {
      event: "stat_bet_saved",
      playerName,
      normalizedName,
      happenedAt: now,
      metadata: {
        matchId,
        matchNumber: match.number,
        matchLabel: `${match.homeTeam} vs ${match.awayTeam}`,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        questionId,
        questionText: question.text ?? null,
        optionId,
        optionText: validOption.text ?? validOption.label ?? null,
        savedAt: now.toISOString(),
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to save stat bet", error);
    return NextResponse.json({ error: "No se pudo guardar la apuesta." }, { status: 500 });
  }
}
