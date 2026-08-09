import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/helpers/mongodb";
import { readMundialMatches } from "@/lib/mundial/matches-store";

export const dynamic = "force-dynamic";

const POSTS_COLLECTION = "mundial_x_posts";
const MAX_POST_LENGTH = 280;

type XPostDoc = {
  _id: ObjectId;
  matchId: string;
  text: string;
  authorName?: string;
  authorUsername?: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

type MatchDoc = {
  id: string;
  homeTeam?: string;
  awayTeam?: string;
};

function cleanText(value: unknown, maxLength = MAX_POST_LENGTH) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function toIsoString(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function serializePost(doc: XPostDoc) {
  const username = cleanText(doc.authorUsername, 32) || "MundialLV";

  return {
    id: doc._id.toString(),
    text: doc.text,
    createdAt: toIsoString(doc.createdAt),
    url: "#",
    author: {
      name: cleanText(doc.authorName, 60) || "Mundial La Vieja",
      username,
      avatarUrl: null,
      verified: true,
    },
    metrics: {
      likes: 0,
      reposts: 0,
      replies: 0,
      quotes: 0,
    },
  };
}

async function findMatch(matchId: string) {
  const db = await getDb();
  const matches = await readMundialMatches<MatchDoc>(db);
  return matches.find((match) => match.id === matchId) ?? null;
}

function payloadFor(match: MatchDoc, posts: XPostDoc[]) {
  const query = `${match.homeTeam ?? ""} vs ${match.awayTeam ?? ""}`.trim();

  return {
    configured: true,
    query,
    searchUrl: "#",
    posts: posts.map(serializePost),
    fetchedAt: new Date().toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId")?.trim() ?? "";

    if (!matchId) {
      return NextResponse.json({ error: "matchId requerido." }, { status: 400 });
    }

    const db = await getDb();
    const match = await findMatch(matchId);
    if (!match) {
      return NextResponse.json({ error: "Partido no encontrado." }, { status: 404 });
    }

    const posts = await db
      .collection<XPostDoc>(POSTS_COLLECTION)
      .find({ matchId })
      .sort({ createdAt: -1, _id: -1 })
      .limit(30)
      .toArray();

    return NextResponse.json(payloadFor(match, posts));
  } catch (error) {
    console.error("Failed to load local X feed", error);
    return NextResponse.json({ error: "No se pudo cargar el feed local de X." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const matchId = cleanText(body.matchId, 80);
    const text = cleanText(body.text);
    const authorName = cleanText(body.authorName, 60) || "Mundial La Vieja";
    const authorUsername = cleanText(body.authorUsername, 32) || "MundialLV";

    if (!matchId) {
      return NextResponse.json({ error: "matchId requerido." }, { status: 400 });
    }
    if (!text) {
      return NextResponse.json({ error: "Escribi una noticia para publicar." }, { status: 400 });
    }

    const match = await findMatch(matchId);
    if (!match) {
      return NextResponse.json({ error: "Partido no encontrado." }, { status: 404 });
    }

    const db = await getDb();
    const now = new Date();
    const result = await db.collection(POSTS_COLLECTION).insertOne({
      matchId,
      text,
      authorName,
      authorUsername,
      createdAt: now,
      updatedAt: now,
    });

    const inserted = await db.collection<XPostDoc>(POSTS_COLLECTION).findOne({ _id: result.insertedId });
    return NextResponse.json({ ok: true, post: inserted ? serializePost(inserted) : null });
  } catch (error) {
    console.error("Failed to publish local X post", error);
    return NextResponse.json({ error: "No se pudo publicar la noticia." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = cleanText(body.id, 80);

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "id invalido." }, { status: 400 });
    }

    const db = await getDb();
    await db.collection(POSTS_COLLECTION).deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete local X post", error);
    return NextResponse.json({ error: "No se pudo borrar la noticia." }, { status: 500 });
  }
}
