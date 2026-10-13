import { Resend } from "resend";
import { APP_BASE_URL_DEFAULT, getEmailFrom } from "@/lib/constants/email";

const FROM = getEmailFrom();
const BASE_URL = process.env.APP_BASE_URL || APP_BASE_URL_DEFAULT;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("RESEND_API_KEY not set — skipping B2B email");
    return null;
  }
  return new Resend(key);
}

// ── Verify email ──────────────────────────────────────────────
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const resend = getResend();
  if (!resend) return;

  const link = `${BASE_URL}/b2b/verify-email?token=${token}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Verifica tu correo — Portal B2B La Vieja Adventures",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:system-ui,sans-serif;background:#f4f4f5;margin:0;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #e4e4e7">
    <h1 style="font-size:20px;font-weight:700;color:#18181b;margin:0 0 8px">Verifica tu correo electrónico</h1>
    <p style="color:#52525b;font-size:15px;margin:0 0 24px">Hola ${name}, gracias por registrarte en el Portal B2B de La Vieja Adventures. Haz clic en el botón para verificar tu cuenta.</p>
    <a href="${link}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px">Verificar mi cuenta</a>
    <p style="color:#a1a1aa;font-size:12px;margin:24px 0 0">Este enlace expira en 24 horas. Si no creaste esta cuenta, ignora este correo.</p>
  </div>
</body>
</html>`,
  });

  if (error) console.error("sendVerificationEmail error:", error);
}

// ── Account approved ──────────────────────────────────────────
export async function sendApprovalEmail(email: string, name: string) {
  const resend = getResend();
  if (!resend) return;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "¡Tu cuenta B2B fue aprobada! — La Vieja Adventures",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:system-ui,sans-serif;background:#f4f4f5;margin:0;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #e4e4e7">
    <h1 style="font-size:20px;font-weight:700;color:#059669;margin:0 0 8px">¡Cuenta aprobada!</h1>
    <p style="color:#52525b;font-size:15px;margin:0 0 16px">Hola ${name}, tu cuenta de operador ha sido aprobada. Ya puedes ingresar al portal y comenzar a realizar reservaciones.</p>
    <a href="${BASE_URL}/b2b/dashboard" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px">Ir al Portal B2B</a>
    <p style="color:#a1a1aa;font-size:12px;margin:24px 0 0">Saludos, equipo de La Vieja Adventures.</p>
  </div>
</body>
</html>`,
  });

  if (error) console.error("sendApprovalEmail error:", error);
}

// ── Password reset ────────────────────────────────────────────
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  const resend = getResend();
  if (!resend) return;

  const link = `${BASE_URL}/b2b/reset-password?token=${token}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Restablece tu contraseña — Portal B2B La Vieja Adventures",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:system-ui,sans-serif;background:#f4f4f5;margin:0;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #e4e4e7">
    <h1 style="font-size:20px;font-weight:700;color:#18181b;margin:0 0 8px">Restablecer contraseña</h1>
    <p style="color:#52525b;font-size:15px;margin:0 0 24px">Hola ${name}, recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para continuar.</p>
    <a href="${link}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px">Restablecer contraseña</a>
    <p style="color:#a1a1aa;font-size:12px;margin:24px 0 0">Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo. Tu contraseña no cambiará.</p>
  </div>
</body>
</html>`,
  });

  if (error) console.error("sendPasswordResetEmail error:", error);
}

// ── Booking confirmation (to operator) ───────────────────────
export async function sendBookingConfirmationEmail(params: {
  operatorEmail: string;
  operatorName: string;
  bookingId: string;
  tourName: string;
  clientName: string;
  clientEmail: string;
  pax: number;
  date: string;
  totalPrice: number;
  commissionAmount: number;
  currency: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const {
    operatorEmail, operatorName, bookingId, tourName,
    clientName, clientEmail, pax, date, totalPrice,
    commissionAmount, currency,
  } = params;

  const { error } = await resend.emails.send({
    from: FROM,
    to: operatorEmail,
    subject: `Reservación confirmada: ${tourName} — Portal B2B`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:system-ui,sans-serif;background:#f4f4f5;margin:0;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #e4e4e7">
    <h1 style="font-size:20px;font-weight:700;color:#18181b;margin:0 0 8px">Nueva reservación creada</h1>
    <p style="color:#52525b;font-size:15px;margin:0 0 24px">Hola ${operatorName}, tu reservación fue registrada exitosamente.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#3f3f46">
      <tr><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;color:#71717a">ID Reservación</td><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-weight:600">${bookingId}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;color:#71717a">Tour</td><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-weight:600">${tourName}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;color:#71717a">Cliente</td><td style="padding:8px 0;border-bottom:1px solid #f4f4f5">${clientName} (${clientEmail})</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;color:#71717a">Personas</td><td style="padding:8px 0;border-bottom:1px solid #f4f4f5">${pax}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;color:#71717a">Fecha</td><td style="padding:8px 0;border-bottom:1px solid #f4f4f5">${date}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;color:#71717a">Total</td><td style="padding:8px 0;border-bottom:1px solid #f4f4f5">${totalPrice.toLocaleString("es-CR")} ${currency}</td></tr>
      <tr><td style="padding:8px 0;color:#71717a">Tu comisión</td><td style="padding:8px 0;color:#059669;font-weight:700">${commissionAmount.toLocaleString("es-CR")} ${currency}</td></tr>
    </table>
    <a href="${BASE_URL}/b2b/bookings" style="display:inline-block;margin-top:28px;background:#059669;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px">Ver mis reservaciones</a>
  </div>
</body>
</html>`,
  });

  if (error) console.error("sendBookingConfirmationEmail error:", error);
}
