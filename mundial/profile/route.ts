import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import {
  MUNDIAL_IDENTITIES_COLLECTION,
  identitySessionMatches,
  normalizeIdentityNameKey,
  readIdentitySession,
  type MundialIdentityDoc,
} from "@/lib/mundial/identity";

export const dynamic = "force-dynamic";

const PROFILES_COLLECTION = "mundial_player_profiles";

type ProfileDoc = {
  normalizedName: string;
  playerName: string;
  email: string;
  phone: string;
  avatarDataUrl: string | null;
  updatedAt: Date;
};

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const db = await getDb();
  const doc = await db
    .collection<ProfileDoc>(PROFILES_COLLECTION)
    .findOne({ normalizedName: name });

  const canReadPrivateProfile = await identitySessionMatches(db, req, name);
  return NextResponse.json({
    email: canReadPrivateProfile ? doc?.email ?? "" : "",
    phone: canReadPrivateProfile ? doc?.phone ?? "" : "",
    avatarDataUrl: doc?.avatarDataUrl ?? null,
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { names?: unknown };
  const names = Array.isArray(body.names)
    ? body.names
        .map((name) => String(name ?? "").trim())
        .filter(Boolean)
        .slice(0, 250)
    : [];

  if (!names.length) return NextResponse.json({ avatars: {} });

  const db = await getDb();
  const docs = await db
    .collection<ProfileDoc>(PROFILES_COLLECTION)
    .find(
      { normalizedName: { $in: names } },
      { projection: { _id: 0, normalizedName: 1, avatarDataUrl: 1 } }
    )
    .toArray();

  const avatars = Object.fromEntries(
    docs.map((doc) => [doc.normalizedName, doc.avatarDataUrl ?? null])
  );

  return NextResponse.json({ avatars });
}

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as {
    normalizedName?: string;
    playerName?: string;
    email?: string;
    phone?: string;
    avatarDataUrl?: string | null;
  };

  const { normalizedName, playerName, email = "", phone = "" } = body;
  const avatarDataUrl = body.avatarDataUrl;

  if (!normalizedName || !playerName || normalizedName !== normalizeIdentityNameKey(playerName)) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  if (typeof avatarDataUrl === "string" && avatarDataUrl.length > 350_000) {
    return NextResponse.json({ error: "Imagen demasiado grande" }, { status: 400 });
  }

  const db = await getDb();
  const session = await readIdentitySession(db, req);
  if (!session || session.normalizedName !== normalizeIdentityNameKey(playerName)) {
    return NextResponse.json({ error: "Sesión inválida. Verificá tu cédula y PIN nuevamente." }, { status: 401 });
  }
  const identity = await db.collection<MundialIdentityDoc>(MUNDIAL_IDENTITIES_COLLECTION).findOne({ cedulaKey: session.cedulaKey });
  if (!identity) return NextResponse.json({ error: "Identidad no encontrada." }, { status: 401 });
  if (email && email.trim().toLowerCase() !== identity.normalizedEmail) {
    return NextResponse.json({ error: "El correo de respaldo no se cambia desde el perfil." }, { status: 409 });
  }
  await db.collection<ProfileDoc>(PROFILES_COLLECTION).updateOne(
    { normalizedName },
    {
      $set: {
        normalizedName,
        playerName,
        email: identity.email,
        phone,
        ...(avatarDataUrl !== undefined && { avatarDataUrl }),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}
