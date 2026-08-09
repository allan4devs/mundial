import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import {
  getScoresDb,
  SCORES_COLLECTIONS,
  ensureIdentityIndexes,
  issueSession,
  normalizeDisplayName,
  normalizeNameKey,
  pinError,
  createPinHash,
  verifyPinHash,
  isLocked,
  recordFailedPin,
  clearFailed,
  clearSession,
  readViewer,
  recordScoresAnalyticsEvent,
  type ScoresIdentityDoc,
} from "@/lib/scores";
import { rateLimit } from "@/lib/scores/rate-limit";

export const dynamic = "force-dynamic";

function clientKey(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** GET session / check name */
export async function GET(req: NextRequest) {
  try {
    const db = await getScoresDb();
    await ensureIdentityIndexes(db);
    const viewer = await readViewer(db, req);
    const name = normalizeDisplayName(req.nextUrl.searchParams.get("name"));
    if (name) {
      const existing = await db
        .collection<ScoresIdentityDoc>(SCORES_COLLECTIONS.IDENTITIES)
        .findOne({ normalizedName: normalizeNameKey(name) });
      return NextResponse.json({
        viewer,
        hasAccount: Boolean(existing),
      });
    }
    return NextResponse.json({ viewer });
  } catch (error) {
    console.error("[scores/auth GET]", error);
    return NextResponse.json({ error: "Error de sesion." }, { status: 500 });
  }
}

/** POST set | verify | logout */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "");
    const db = await getScoresDb();
    await ensureIdentityIndexes(db);

    if (action === "logout") {
      const res = NextResponse.json({ ok: true });
      await clearSession(db, req, res);
      return res;
    }

    const rl = rateLimit(`scores-auth:${clientKey(req)}`, 20, 15 * 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Demasiados intentos. Espera ${rl.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    const displayName = normalizeDisplayName(body.displayName ?? body.playerName);
    const pin = String(body.pin ?? "").trim();
    if (!displayName || displayName.length < 2) {
      return NextResponse.json({ error: "Nombre invalido." }, { status: 400 });
    }
    const pinErr = pinError(pin);
    if (pinErr) return NextResponse.json({ error: pinErr }, { status: 400 });

    const col = db.collection<ScoresIdentityDoc>(SCORES_COLLECTIONS.IDENTITIES);
    const key = normalizeNameKey(displayName);
    const now = new Date();

    if (action === "set") {
      const existing = await col.findOne({ normalizedName: key });
      if (existing) {
        return NextResponse.json({ error: "Ese nombre ya tiene cuenta. Usa verificar." }, { status: 409 });
      }
      const { hash, salt } = createPinHash(pin);
      const insert = await col.insertOne({
        _id: new ObjectId(),
        displayName,
        normalizedName: key,
        pinHash: hash,
        pinSalt: salt,
        failedAttempts: 0,
        lockUntil: null,
        createdAt: now,
        updatedAt: now,
      } as ScoresIdentityDoc);
      const res = NextResponse.json({
        ok: true,
        viewer: { userId: insert.insertedId.toString(), displayName },
      });
      await issueSession(db, res, { userId: insert.insertedId.toString(), displayName });
      await recordScoresAnalyticsEvent(db, "account_created", insert.insertedId.toString()).catch(
        (error) => console.error("[scores/analytics account_created]", error)
      );
      return res;
    }

    if (action === "verify") {
      const identity = await col.findOne({ normalizedName: key });
      if (!identity) {
        return NextResponse.json({ error: "No hay cuenta con ese nombre." }, { status: 404 });
      }
      if (isLocked(identity)) {
        return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 });
      }
      if (!verifyPinHash(pin, identity)) {
        await recordFailedPin(db, identity._id);
        return NextResponse.json({ error: "PIN incorrecto." }, { status: 401 });
      }
      await clearFailed(db, identity._id);
      const userId = identity._id.toString();
      const res = NextResponse.json({
        ok: true,
        viewer: { userId, displayName: identity.displayName },
      });
      await issueSession(db, res, { userId, displayName: identity.displayName });
      await recordScoresAnalyticsEvent(db, "login", userId).catch((error) =>
        console.error("[scores/analytics login]", error)
      );
      return res;
    }

    return NextResponse.json({ error: "Accion invalida." }, { status: 400 });
  } catch (error) {
    console.error("[scores/auth POST]", error);
    return NextResponse.json({ error: "No se pudo autenticar." }, { status: 500 });
  }
}
