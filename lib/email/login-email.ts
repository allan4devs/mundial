import { Resend } from "resend";
import { APP_BASE_URL_DEFAULT, getEmailFrom } from "@/lib/constants/email";

const FROM = getEmailFrom();
const BASE_URL = process.env.APP_BASE_URL || APP_BASE_URL_DEFAULT;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping login notification email");
    return null;
  }

  return new Resend(apiKey);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendLoginNotificationEmail(params: {
  email: string;
  name?: string | null;
}) {
  const resend = getResendClient();
  if (!resend) return;

  const safeEmail = escapeHtml(params.email);
  const safeName = escapeHtml(params.name?.trim() || "viajero");
  const timestamp = new Date().toLocaleString("es-CR", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.email,
    subject: "Nuevo inicio de sesión en tu cuenta — La Vieja Adventures",
    html: `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /></head>
  <body style="font-family:system-ui,sans-serif;background:#f4f4f5;margin:0;padding:32px 16px">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #e4e4e7">
      <h1 style="font-size:20px;font-weight:700;color:#18181b;margin:0 0 8px">Inicio de sesión detectado</h1>
      <p style="color:#52525b;font-size:15px;margin:0 0 16px">Hola ${safeName}, detectamos un nuevo inicio de sesión en tu cuenta.</p>
      <p style="color:#3f3f46;font-size:14px;margin:0 0 8px"><strong>Correo:</strong> ${safeEmail}</p>
      <p style="color:#3f3f46;font-size:14px;margin:0 0 24px"><strong>Fecha:</strong> ${escapeHtml(timestamp)}</p>
      <a href="${BASE_URL}/auth/profile" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px">Ver mi perfil</a>
      <p style="color:#a1a1aa;font-size:12px;margin:24px 0 0">Si no fuiste tú, te recomendamos cambiar tu contraseña inmediatamente.</p>
    </div>
  </body>
</html>`,
  });

  if (error) {
    console.error("sendLoginNotificationEmail error:", error);
  }
}
