import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import { sendMundialPinConfiguredEmail } from "@/lib/email/mundial-pin-email";
import { recordMundialAnalyticsEvent } from "@/lib/mundial/analytics";
import {
  MUNDIAL_IDENTITIES_COLLECTION,
  clearFailedPins,
  createPinHash,
  ensureIdentityIndexes,
  identityLocked,
  issueIdentitySession,
  normalizeCedula,
  normalizeIdentityEmail,
  normalizeIdentityName,
  normalizeIdentityNameKey,
  pinValidationError,
  recordFailedPin,
  validCedula,
  validEmail,
  verifyLegacyPin,
  verifyPinHash,
  type MundialIdentityDoc,
} from "@/lib/mundial/identity";

export const dynamic = "force-dynamic";

const LEGACY_PINS_COLLECTION = "mundial_pins";

type LegacyPinDoc = {
  normalizedName: string;
  playerName?: string;
  pinHash?: string;
  migratedCedulaKey?: string;
};

function publicIdentityError() {
  return NextResponse.json({ error: "La cédula no corresponde a ese jugador." }, { status: 409 });
}

export async function GET(req: NextRequest) {
  const playerName = normalizeIdentityName(req.nextUrl.searchParams.get("playerName"));
  const normalizedName = normalizeIdentityNameKey(playerName);
  const cedulaKey = normalizeCedula(req.nextUrl.searchParams.get("cedula"));
  if (!playerName) return NextResponse.json({ error: "Nombre requerido." }, { status: 400 });
  if (!validCedula(cedulaKey)) return NextResponse.json({ error: "Cédula inválida." }, { status: 400 });

  try {
    const db = await getDb();
    await ensureIdentityIndexes(db);
    const identities = db.collection<MundialIdentityDoc>(MUNDIAL_IDENTITIES_COLLECTION);
    const [byCedula, byName] = await Promise.all([
      identities.findOne({ cedulaKey }),
      identities.findOne({ normalizedName }),
    ]);

    if (byCedula) {
      if (byCedula.normalizedName !== normalizedName) return publicIdentityError();
      return NextResponse.json({ hasPinSet: true, pinLength: 6 });
    }
    if (byName) return publicIdentityError();

    const legacy = await db.collection<LegacyPinDoc>(LEGACY_PINS_COLLECTION).findOne({ normalizedName });
    if (legacy?.pinHash && !legacy.migratedCedulaKey) {
      return NextResponse.json({ hasPinSet: false, migrationRequired: true, legacyPinLength: 4 });
    }
    return NextResponse.json({ hasPinSet: false, migrationRequired: false, pinLength: 6 });
  } catch (error) {
    console.error("PIN GET", error);
    return NextResponse.json({ error: "Error al verificar la identidad." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");
    const playerName = normalizeIdentityName(body.playerName);
    const normalizedName = normalizeIdentityNameKey(playerName);
    const cedulaKey = normalizeCedula(body.cedula);
    const email = normalizeIdentityEmail(body.email);
    const pin = String(body.pin ?? "").trim();
    const legacyPin = String(body.legacyPin ?? "").trim();

    if (!playerName) return NextResponse.json({ error: "Nombre requerido." }, { status: 400 });
    if (!validCedula(cedulaKey)) return NextResponse.json({ error: "Cédula inválida." }, { status: 400 });
    if (!["set", "verify", "migrate"].includes(action)) {
      return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
    }

    const db = await getDb();
    await ensureIdentityIndexes(db);
    const identities = db.collection<MundialIdentityDoc>(MUNDIAL_IDENTITIES_COLLECTION);

    if (action === "verify") {
      const identity = await identities.findOne({ cedulaKey });
      if (!identity || identity.normalizedName !== normalizedName) return publicIdentityError();
      if (identityLocked(identity)) {
        return NextResponse.json({ error: "Demasiados intentos. Probá de nuevo en 15 minutos." }, { status: 429 });
      }
      if (!verifyPinHash(pin, identity)) {
        await recordFailedPin(db, identity);
        return NextResponse.json({ valid: false, hasPinSet: true }, { status: 401 });
      }

      await clearFailedPins(db, cedulaKey);
      const response = NextResponse.json({ valid: true, hasPinSet: true, playerName: identity.playerName });
      await issueIdentitySession(db, response, identity);
      await recordMundialAnalyticsEvent(db, req, {
        event: "login",
        playerName: identity.playerName,
        normalizedName,
        metadata: { loginMethod: "cedula_pin" },
      });
      return response;
    }

    const pinError = pinValidationError(pin, cedulaKey);
    if (pinError) return NextResponse.json({ error: pinError }, { status: 400 });
    if (!validEmail(email)) return NextResponse.json({ error: "Correo inválido." }, { status: 400 });

    const [byCedula, byName] = await Promise.all([
      identities.findOne({ cedulaKey }),
      identities.findOne({ normalizedName }),
    ]);
    if (byCedula || byName) return publicIdentityError();

    let migrated = false;
    if (action === "migrate") {
      if (!/^\d{4}$/.test(legacyPin)) {
        return NextResponse.json({ error: "Ingresá tu PIN anterior de 4 dígitos." }, { status: 400 });
      }
      const legacy = await db.collection<LegacyPinDoc>(LEGACY_PINS_COLLECTION).findOne({ normalizedName });
      if (!legacy?.pinHash || legacy.migratedCedulaKey || !verifyLegacyPin(legacyPin, normalizedName, legacy.pinHash)) {
        return NextResponse.json({ error: "El PIN anterior no es correcto." }, { status: 401 });
      }
      migrated = true;
    } else {
      const legacy = await db.collection<LegacyPinDoc>(LEGACY_PINS_COLLECTION).findOne({ normalizedName, pinHash: { $exists: true } });
      if (legacy) return NextResponse.json({ error: "Esta cuenta debe migrar su PIN anterior." }, { status: 409 });
    }

    const now = new Date();
    const { hash, salt } = createPinHash(pin);
    const identity: MundialIdentityDoc = {
      cedulaKey,
      playerName,
      normalizedName,
      email,
      normalizedEmail: email,
      pinHash: hash,
      pinSalt: salt,
      pinVersion: 2,
      failedAttempts: 0,
      lockUntil: null,
      createdAt: now,
      updatedAt: now,
    };
    await identities.insertOne(identity);
    if (migrated) {
      await db.collection<LegacyPinDoc>(LEGACY_PINS_COLLECTION).updateOne(
        { normalizedName },
        { $set: { migratedCedulaKey: cedulaKey } },
      );
    }

    try {
      await sendMundialPinConfiguredEmail({ email, playerName, migrated });
    } catch (emailError) {
      await identities.deleteOne({ cedulaKey });
      if (migrated) {
        await db.collection<LegacyPinDoc>(LEGACY_PINS_COLLECTION).updateOne(
          { normalizedName },
          { $unset: { migratedCedulaKey: "" } },
        );
      }
      throw emailError;
    }

    await db.collection("mundial_player_profiles").updateOne(
      { normalizedName },
      {
        $set: { normalizedName, playerName, email, updatedAt: now },
        $setOnInsert: { phone: "", avatarDataUrl: null },
      },
      { upsert: true },
    );

    const response = NextResponse.json({ ok: true, valid: true, isNew: !migrated, migrated, playerName });
    await issueIdentitySession(db, response, identity);
    await recordMundialAnalyticsEvent(db, req, {
      event: "login",
      playerName,
      normalizedName,
      happenedAt: now,
      metadata: { loginMethod: migrated ? "cedula_pin_migrated" : "cedula_pin_created" },
    });
    return response;
  } catch (error) {
    console.error("PIN POST", error);
    const message = error instanceof Error && error.message.startsWith("No se pudo enviar")
      ? error.message
      : "Error al procesar la identidad y el PIN.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
