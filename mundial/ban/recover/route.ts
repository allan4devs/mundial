// app/api/mundial/ban/recover/route.ts
// Multi-step ban recovery flow API.
// Steps: 0=init 1-3=captcha 4=form 5=signature 6=email 7=phone 8=totp 9=complete
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import {
  isBanned,
  getBan,
  createRecoveryTicket,
  getTicket,
  updateTicket,
  invalidateTicket,
  isTicketExpired,
  generateCaptcha,
  generateVerificationCode,
  generateTotpSecret,
  getTotpUri,
  verifyTotpCode,
  MAX_CODE_ATTEMPTS,
} from "@/lib/mundial/bans";
import {
  sendEmailVerificationCode,
  sendPhoneVerificationCode,
  sendTicketConfirmation,
} from "@/lib/email/banEmail";

export const dynamic = "force-dynamic";

const CODE_VALID_MS = 15 * 60 * 1000; // 15 minutes

function normalizeKey(v: string) { return v.trim().toUpperCase(); }
function normalizeName(v: unknown) { return String(v ?? "").trim().replace(/\s+/g, " "); }

function expiredCodeResponse() {
  return NextResponse.json({ error: "El código expiró. Solicita uno nuevo." }, { status: 410 });
}
function tooManyAttemptsResponse() {
  return NextResponse.json({ error: "Demasiados intentos incorrectos. El ticket ha sido invalidado." }, { status: 429 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const action = String(body.action ?? "").trim();

    const db = await getDb();

    // ── START ──────────────────────────────────────────────────────────────
    if (action === "start") {
      const playerName = normalizeName(body.playerName);
      const normalizedName = normalizeKey(playerName);
      if (!playerName) return NextResponse.json({ error: "playerName requerido." }, { status: 400 });

      const ban = await isBanned(db, normalizedName, null);
      if (!ban) return NextResponse.json({ error: "No hay ban activo para ese jugador." }, { status: 404 });

      const { ticketId } = await createRecoveryTicket(db, normalizedName, ban.playerName);
      const captcha = generateCaptcha();
      await updateTicket(db, ticketId, { captchaAnswer: captcha.answer, step: 0 });

      return NextResponse.json({ ok: true, ticketId, captchaQuestion: captcha.question });
    }

    // All remaining actions require ticketId
    const ticketId = String(body.ticketId ?? "").trim();
    if (!ticketId) return NextResponse.json({ error: "ticketId requerido." }, { status: 400 });

    const ticket = await getTicket(db, ticketId);
    if (!ticket) return NextResponse.json({ error: "Ticket no encontrado o ya inválido." }, { status: 404 });
    if (isTicketExpired(ticket)) {
      await invalidateTicket(db, ticketId);
      return NextResponse.json({ error: "El proceso expiró. Debes iniciar de nuevo." }, { status: 410 });
    }

    // ── CAPTCHA ────────────────────────────────────────────────────────────
    if (action === "captcha") {
      if (ticket.step > 2) return NextResponse.json({ error: "Ya completaste los CAPTCHAs." }, { status: 400 });

      const answer = Number(body.answer);
      if (answer !== ticket.captchaAnswer) {
        return NextResponse.json({ error: "Respuesta incorrecta. Intenta de nuevo." }, { status: 422 });
      }

      const passed = ticket.captchasPassed + 1;

      if (passed < 3) {
        const captcha = generateCaptcha();
        await updateTicket(db, ticketId, { captchasPassed: passed, step: passed, captchaAnswer: captcha.answer });
        return NextResponse.json({ ok: true, captchasPassed: passed, captchaQuestion: captcha.question });
      }

      // All 3 passed
      await updateTicket(db, ticketId, { captchasPassed: 3, step: 3, captchaAnswer: null });
      return NextResponse.json({ ok: true, captchasPassed: 3, nextStep: "form" });
    }

    // ── FORM ────────────────────────────────────────────────────────────────
    if (action === "form") {
      if (ticket.step < 3) return NextResponse.json({ error: "Completa los CAPTCHAs primero." }, { status: 400 });
      if (ticket.step > 3) return NextResponse.json({ error: "Ya enviaste el formulario." }, { status: 400 });

      const fullName = String(body.fullName ?? "").trim().slice(0, 100);
      const email = String(body.email ?? "").trim().toLowerCase().slice(0, 150);
      const phone = String(body.phone ?? "").trim().slice(0, 30);
      const message = String(body.message ?? "").trim().slice(0, 1000);

      if (!fullName) return NextResponse.json({ error: "Nombre completo requerido." }, { status: 400 });
      if (!email || !email.includes("@")) return NextResponse.json({ error: "Email válido requerido." }, { status: 400 });
      if (!phone) return NextResponse.json({ error: "Teléfono requerido." }, { status: 400 });
      if (!message || message.length < 20) return NextResponse.json({ error: "Escribe al menos 20 caracteres en el motivo." }, { status: 400 });

      await updateTicket(db, ticketId, { formData: { fullName, email, phone, message }, step: 4 });
      return NextResponse.json({ ok: true, nextStep: "signature" });
    }

    // ── SIGNATURE ───────────────────────────────────────────────────────────
    if (action === "signature") {
      if (ticket.step < 4) return NextResponse.json({ error: "Completa el formulario primero." }, { status: 400 });
      if (ticket.step > 4) return NextResponse.json({ error: "Ya subiste la firma." }, { status: 400 });

      const imageData = String(body.imageData ?? "").trim();
      if (!imageData.startsWith("data:image/")) {
        return NextResponse.json({ error: "Imagen inválida. Sube una foto (JPG/PNG)." }, { status: 400 });
      }
      // Limit to ~4MB of base64
      if (imageData.length > 6_000_000) {
        return NextResponse.json({ error: "Imagen demasiado grande. Máximo 4MB." }, { status: 413 });
      }

      await updateTicket(db, ticketId, { signatureDataUrl: imageData, signatureUploaded: true, step: 5 });
      return NextResponse.json({ ok: true, nextStep: "email" });
    }

    // ── SEND EMAIL CODE ─────────────────────────────────────────────────────
    if (action === "send-email-code") {
      if (ticket.step < 5) return NextResponse.json({ error: "Completa la firma primero." }, { status: 400 });
      if (ticket.emailVerified) return NextResponse.json({ ok: true, nextStep: "phone" });

      if (!ticket.formData?.email) return NextResponse.json({ error: "Sin email en el formulario." }, { status: 400 });

      // Rate limit: don't resend within 60s
      if (ticket.emailCodeSentAt) {
        const elapsed = Date.now() - new Date(ticket.emailCodeSentAt).getTime();
        if (elapsed < 60_000) {
          return NextResponse.json({ error: "Espera un minuto antes de reenviar el código." }, { status: 429 });
        }
      }

      const code = generateVerificationCode();
      await updateTicket(db, ticketId, {
        emailCode: code,
        emailCodeSentAt: new Date(),
        emailCodeAttempts: 0,
        step: Math.max(ticket.step, 5),
      });

      await sendEmailVerificationCode({
        to: ticket.formData.email,
        playerName: ticket.playerName,
        code,
        ticketId,
      });

      const masked = ticket.formData.email.replace(/(.{1,2}).*(@.*)/, "$1***$2");
      return NextResponse.json({ ok: true, emailMasked: masked });
    }

    // ── VERIFY EMAIL ─────────────────────────────────────────────────────────
    if (action === "verify-email") {
      if (ticket.emailVerified) return NextResponse.json({ ok: true, nextStep: "phone" });
      if (!ticket.emailCode) return NextResponse.json({ error: "Solicita el código primero." }, { status: 400 });

      if (ticket.emailCodeAttempts >= MAX_CODE_ATTEMPTS) {
        await invalidateTicket(db, ticketId);
        return tooManyAttemptsResponse();
      }

      const elapsed = ticket.emailCodeSentAt ? Date.now() - new Date(ticket.emailCodeSentAt).getTime() : Infinity;
      if (elapsed > CODE_VALID_MS) return expiredCodeResponse();

      const code = String(body.code ?? "").trim();
      if (code !== ticket.emailCode) {
        await updateTicket(db, ticketId, { emailCodeAttempts: ticket.emailCodeAttempts + 1 });
        const remaining = MAX_CODE_ATTEMPTS - ticket.emailCodeAttempts - 1;
        return NextResponse.json({ error: `Código incorrecto. ${remaining} intento${remaining === 1 ? "" : "s"} restante${remaining === 1 ? "" : "s"}.` }, { status: 422 });
      }

      await updateTicket(db, ticketId, { emailVerified: true, emailCode: null, step: 6 });
      return NextResponse.json({ ok: true, nextStep: "phone" });
    }

    // ── SEND PHONE CODE ──────────────────────────────────────────────────────
    if (action === "send-phone-code") {
      if (ticket.step < 6) return NextResponse.json({ error: "Verifica tu email primero." }, { status: 400 });
      if (ticket.phoneVerified) return NextResponse.json({ ok: true, nextStep: "totp" });

      if (!ticket.formData?.email || !ticket.formData?.phone) {
        return NextResponse.json({ error: "Faltan datos de contacto." }, { status: 400 });
      }

      if (ticket.phoneCodeSentAt) {
        const elapsed = Date.now() - new Date(ticket.phoneCodeSentAt).getTime();
        if (elapsed < 60_000) {
          return NextResponse.json({ error: "Espera un minuto antes de reenviar el código." }, { status: 429 });
        }
      }

      const code = generateVerificationCode();
      await updateTicket(db, ticketId, {
        phoneCode: code,
        phoneCodeSentAt: new Date(),
        phoneCodeAttempts: 0,
        step: Math.max(ticket.step, 6),
      });

      await sendPhoneVerificationCode({
        to: ticket.formData.email,
        playerName: ticket.playerName,
        code,
        phone: ticket.formData.phone,
        ticketId,
      });

      const maskedPhone = ticket.formData.phone.replace(/(\d{2})\d+(\d{2})/, "$1****$2");
      return NextResponse.json({ ok: true, phoneMasked: maskedPhone });
    }

    // ── VERIFY PHONE ─────────────────────────────────────────────────────────
    if (action === "verify-phone") {
      if (ticket.phoneVerified) return NextResponse.json({ ok: true, nextStep: "totp" });
      if (!ticket.phoneCode) return NextResponse.json({ error: "Solicita el código primero." }, { status: 400 });

      if (ticket.phoneCodeAttempts >= MAX_CODE_ATTEMPTS) {
        await invalidateTicket(db, ticketId);
        return tooManyAttemptsResponse();
      }

      const elapsed = ticket.phoneCodeSentAt ? Date.now() - new Date(ticket.phoneCodeSentAt).getTime() : Infinity;
      if (elapsed > CODE_VALID_MS) return expiredCodeResponse();

      const code = String(body.code ?? "").trim();
      if (code !== ticket.phoneCode) {
        await updateTicket(db, ticketId, { phoneCodeAttempts: ticket.phoneCodeAttempts + 1 });
        const remaining = MAX_CODE_ATTEMPTS - ticket.phoneCodeAttempts - 1;
        return NextResponse.json({ error: `Código incorrecto. ${remaining} intento${remaining === 1 ? "" : "s"} restante${remaining === 1 ? "" : "s"}.` }, { status: 422 });
      }

      await updateTicket(db, ticketId, { phoneVerified: true, phoneCode: null, step: 7 });
      return NextResponse.json({ ok: true, nextStep: "totp" });
    }

    // ── GET TOTP SECRET ──────────────────────────────────────────────────────
    if (action === "get-totp") {
      if (ticket.step < 7) return NextResponse.json({ error: "Verifica tu teléfono primero." }, { status: 400 });
      if (ticket.totpVerified) return NextResponse.json({ ok: true, nextStep: "done" });

      let secret = ticket.totpSecret;
      if (!secret) {
        secret = generateTotpSecret();
        await updateTicket(db, ticketId, { totpSecret: secret, step: Math.max(ticket.step, 7) });
      }

      const uri = getTotpUri(secret, ticket.playerName);
      // Format secret in groups of 4 for readability
      const formatted = secret.match(/.{1,4}/g)?.join(" ") ?? secret;
      return NextResponse.json({ ok: true, secret: formatted, rawSecret: secret, totpUri: uri });
    }

    // ── VERIFY TOTP ──────────────────────────────────────────────────────────
    if (action === "verify-totp") {
      if (ticket.step < 7) return NextResponse.json({ error: "Configura el autenticador primero." }, { status: 400 });
      if (ticket.totpVerified) return NextResponse.json({ ok: true, nextStep: "done", ticketId });
      if (!ticket.totpSecret) return NextResponse.json({ error: "Solicita el secreto TOTP primero." }, { status: 400 });

      const code = String(body.code ?? "").replace(/\s/g, "").trim();
      if (!verifyTotpCode(ticket.totpSecret, code)) {
        return NextResponse.json({ error: "Código incorrecto. Verifica la hora de tu dispositivo y vuelve a intentarlo." }, { status: 422 });
      }

      await updateTicket(db, ticketId, { totpVerified: true, step: 8 });

      // Send confirmation email
      if (ticket.formData?.email) {
        await sendTicketConfirmation({
          to: ticket.formData.email,
          playerName: ticket.playerName,
          ticketId,
        });
      }

      return NextResponse.json({ ok: true, nextStep: "done", ticketId });
    }

    return NextResponse.json({ error: `Acción desconocida: ${action}` }, { status: 400 });
  } catch (err) {
    console.error("[ban/recover] POST error", err);
    return NextResponse.json({ error: "Error en el proceso de recuperación." }, { status: 500 });
  }
}

// GET — resume a ticket (returns current step)
export async function GET(req: NextRequest) {
  try {
    const ticketId = (req.nextUrl.searchParams.get("ticketId") ?? "").trim();
    if (!ticketId) return NextResponse.json({ error: "ticketId requerido." }, { status: 400 });

    const db = await getDb();
    const ticket = await getTicket(db, ticketId);
    if (!ticket) return NextResponse.json({ error: "Ticket no encontrado." }, { status: 404 });

    if (isTicketExpired(ticket)) {
      await invalidateTicket(db, ticketId);
      return NextResponse.json({ error: "Ticket expirado." }, { status: 410 });
    }

    // Check ban status (might already be lifted by admin)
    const ban = await getBan(db, ticket.normalizedName);
    const stillBanned = ban?.active ?? false;

    return NextResponse.json({
      ticketId: ticket._id,
      playerName: ticket.playerName,
      step: ticket.step,
      captchasPassed: ticket.captchasPassed,
      hasForm: !!ticket.formData,
      signatureUploaded: ticket.signatureUploaded,
      emailVerified: ticket.emailVerified,
      emailMasked: ticket.formData?.email
        ? ticket.formData.email.replace(/(.{1,2}).*(@.*)/, "$1***$2")
        : null,
      phoneMasked: ticket.formData?.phone
        ? ticket.formData.phone.replace(/(\d{2})\d+(\d{2})/, "$1****$2")
        : null,
      phoneVerified: ticket.phoneVerified,
      totpVerified: ticket.totpVerified,
      expiresAt: ticket.expiresAt,
      stillBanned,
    });
  } catch (err) {
    console.error("[ban/recover] GET error", err);
    return NextResponse.json({ error: "Error al consultar ticket." }, { status: 500 });
  }
}
