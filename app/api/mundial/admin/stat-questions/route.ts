import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/helpers/mongodb";
import { readMundialMatches } from "@/lib/mundial/matches-store";

export const dynamic = "force-dynamic";

const STAT_QUESTIONS_COLLECTION = "mundial_stat_questions";
const STAT_BETS_COLLECTION = "mundial_stat_bets";

type StatOption = { id: string; label: string };

async function ensureIndexes() {
  const db = await getDb();
  await Promise.all([
    db.collection(STAT_QUESTIONS_COLLECTION).createIndex({ id: 1 }, { unique: true }),
    db.collection(STAT_QUESTIONS_COLLECTION).createIndex({ matchId: 1 }),
    db.collection(STAT_BETS_COLLECTION).createIndex({ questionId: 1, normalizedName: 1 }, { unique: true }),
    db.collection(STAT_BETS_COLLECTION).createIndex({ matchId: 1 }),
  ]);
}

export async function GET() {
  try {
    const db = await getDb();
    await ensureIndexes();

    const [questions, bets] = await Promise.all([
      db.collection(STAT_QUESTIONS_COLLECTION).find({}).sort({ createdAt: 1 }).toArray(),
      db.collection(STAT_BETS_COLLECTION).find({}).toArray(),
    ]);

    return NextResponse.json({
      statQuestions: questions.map((q) => ({
        id: q.id,
        matchId: q.matchId,
        matchNumber: q.matchNumber,
        matchLabel: q.matchLabel,
        text: q.text,
        options: q.options,
        correctOptionId: q.correctOptionId ?? null,
        resolved: Boolean(q.correctOptionId),
        pointValue: q.pointValue ?? 1,
        totalBets: bets.filter((b) => b.questionId === q.id).length,
      })),
    });
  } catch (error) {
    console.error("Failed to load stat questions", error);
    return NextResponse.json({ error: "No se pudo cargar las preguntas." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { matchId, text, options, pointValue } = body;

    if (!matchId || typeof matchId !== "string") {
      return NextResponse.json({ error: "matchId requerido." }, { status: 400 });
    }
    if (!text || typeof text !== "string" || text.trim().length < 3) {
      return NextResponse.json({ error: "Pregunta invalida (min 3 caracteres)." }, { status: 400 });
    }
    if (!Array.isArray(options) || options.length < 2 || options.length > 4) {
      return NextResponse.json({ error: "Se necesitan entre 2 y 4 opciones." }, { status: 400 });
    }

    const parsedOptions: StatOption[] = options.map((opt: unknown, i: number) => {
      if (typeof opt === "string") return { id: `opt_${i}`, label: opt.trim() };
      if (opt && typeof opt === "object" && "label" in opt) {
        return { id: `opt_${i}`, label: String((opt as { label: unknown }).label).trim() };
      }
      return { id: `opt_${i}`, label: `Opción ${i + 1}` };
    });

    if (parsedOptions.some((o) => !o.label)) {
      return NextResponse.json({ error: "Todas las opciones necesitan etiqueta." }, { status: 400 });
    }

    const db = await getDb();
    const matches = await readMundialMatches(db);
    const match = matches.find((m) => m.id === matchId);
    if (!match) {
      return NextResponse.json({ error: "Partido no encontrado." }, { status: 404 });
    }

    await ensureIndexes();

    const id = new ObjectId().toString();
    const now = new Date();

    await db.collection(STAT_QUESTIONS_COLLECTION).insertOne({
      id,
      matchId,
      matchNumber: match.number,
      matchLabel: `${match.homeTeam} vs ${match.awayTeam}`,
      text: text.trim(),
      options: parsedOptions,
      correctOptionId: null,
      pointValue: typeof pointValue === "number" && pointValue > 0 ? pointValue : 1,
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create stat question", error);
    return NextResponse.json({ error: "No se pudo crear la pregunta." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, correctOptionId } = await req.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id requerido." }, { status: 400 });
    }

    const db = await getDb();
    const question = await db.collection(STAT_QUESTIONS_COLLECTION).findOne({ id });

    if (!question) {
      return NextResponse.json({ error: "Pregunta no encontrada." }, { status: 404 });
    }

    const validOption = question.options?.find((o: StatOption) => o.id === correctOptionId);
    if (correctOptionId !== null && !validOption) {
      return NextResponse.json({ error: "Opcion invalida." }, { status: 400 });
    }

    const now = new Date();
    await db.collection(STAT_QUESTIONS_COLLECTION).updateOne(
      { id },
      {
        $set: {
          correctOptionId: correctOptionId ?? null,
          resolvedAt: correctOptionId ? now : null,
          updatedAt: now,
        },
      }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to resolve stat question", error);
    return NextResponse.json({ error: "No se pudo resolver la pregunta." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id requerido." }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection(STAT_QUESTIONS_COLLECTION).deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Pregunta no encontrada." }, { status: 404 });
    }

    await db.collection(STAT_BETS_COLLECTION).deleteMany({ questionId: id });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete stat question", error);
    return NextResponse.json({ error: "No se pudo eliminar la pregunta." }, { status: 500 });
  }
}
