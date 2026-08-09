import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

import {
  getScoresDb,
  SCORES_COLLECTIONS,
  ensureIdentityIndexes,
  readViewer,
  normalizeDisplayName,
  normalizeNameKey,
  normalizeNotificationEmail,
  normalizeTimezone,
  type ScoresIdentityDoc,
} from "@/lib/scores";

export const dynamic = "force-dynamic";

function serializeProfile(identity: ScoresIdentityDoc) {
  return {
    displayName: identity.displayName,
    notificationEmail: identity.notificationEmail ?? "",
    notificationEmailVerified: Boolean(identity.notificationEmailVerifiedAt),
    notificationConsent: Boolean(identity.notificationConsentAt),
    preferences: {
      pickClosingReminder: identity.preferences?.pickClosingReminder ?? false,
      resultsDigest: identity.preferences?.resultsDigest ?? false,
      timezone: identity.preferences?.timezone ?? "America/Costa_Rica",
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const db = await getScoresDb();
    await ensureIdentityIndexes(db);
    const viewer = await readViewer(db, req);
    if (!viewer) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const identity = await db
      .collection<ScoresIdentityDoc>(SCORES_COLLECTIONS.IDENTITIES)
      .findOne({ _id: new ObjectId(viewer.userId) });
    if (!identity) return NextResponse.json({ error: "Perfil no encontrado." }, { status: 404 });
    return NextResponse.json({ profile: serializeProfile(identity) });
  } catch (error) {
    console.error("[scores/profile GET]", error);
    return NextResponse.json({ error: "No se pudo cargar el perfil." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = await getScoresDb();
    await ensureIdentityIndexes(db);
    const viewer = await readViewer(db, req);
    if (!viewer) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const body = await req.json();
    const identityId = new ObjectId(viewer.userId);
    const current = await db
      .collection<ScoresIdentityDoc>(SCORES_COLLECTIONS.IDENTITIES)
      .findOne({ _id: identityId });
    if (!current) return NextResponse.json({ error: "Perfil no encontrado." }, { status: 404 });

    const $set: Record<string, unknown> = { updatedAt: new Date() };
    if ("displayName" in body) {
      const displayName = normalizeDisplayName(body.displayName);
      if (displayName.length < 2) {
        return NextResponse.json({ error: "Nombre invalido." }, { status: 400 });
      }
      $set.displayName = displayName;
      $set.normalizedName = normalizeNameKey(displayName);
    }

    if ("notificationEmail" in body) {
      const email = normalizeNotificationEmail(body.notificationEmail);
      if (email === null) {
        return NextResponse.json({ error: "Email invalido." }, { status: 400 });
      }
      $set.notificationEmail = email || null;
      $set.normalizedNotificationEmail = email || null;
      if (email !== current.normalizedNotificationEmail) {
        $set.notificationEmailVerifiedAt = null;
      }
    }

    const consent = Boolean(body.notificationConsent);
    $set.notificationConsentAt = consent ? current.notificationConsentAt ?? new Date() : null;
    $set.preferences = {
      pickClosingReminder: consent && Boolean(body.preferences?.pickClosingReminder),
      resultsDigest: consent && Boolean(body.preferences?.resultsDigest),
      timezone: normalizeTimezone(body.preferences?.timezone),
    };

    try {
      await db
        .collection<ScoresIdentityDoc>(SCORES_COLLECTIONS.IDENTITIES)
        .updateOne({ _id: identityId }, { $set });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: number }).code === 11000
      ) {
        return NextResponse.json({ error: "Ese nombre ya esta en uso." }, { status: 409 });
      }
      throw error;
    }

    if (typeof $set.displayName === "string") {
      await db
        .collection(SCORES_COLLECTIONS.SESSIONS)
        .updateMany({ userId: viewer.userId }, { $set: { displayName: $set.displayName } });
    }

    const updated = await db
      .collection<ScoresIdentityDoc>(SCORES_COLLECTIONS.IDENTITIES)
      .findOne({ _id: identityId });
    return NextResponse.json({ profile: serializeProfile(updated!) });
  } catch (error) {
    console.error("[scores/profile PATCH]", error);
    return NextResponse.json({ error: "No se pudo actualizar el perfil." }, { status: 500 });
  }
}
