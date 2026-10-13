import { Resend } from "resend";
import { APP_BASE_URL_DEFAULT, getEmailFrom } from "@/lib/constants/email";

const FROM = getEmailFrom();
const BASE_URL = process.env.APP_BASE_URL || APP_BASE_URL_DEFAULT;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("RESEND_API_KEY not set — skipping user email");
    return null;
  }
  return new Resend(key);
}

export async function sendUserPasswordResetEmail(email: string, name: string, token: string) {
  const resend = getResend();
  if (!resend) return;

  const link = `${BASE_URL}/auth/reset-password?token=${token}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Restablece tu contraseña — La Vieja Adventures",
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

  if (error) console.error("sendUserPasswordResetEmail error:", error);
}

export async function sendUserWelcomeEmail(email: string, name: string) {
  const resend = getResend();
  if (!resend) return;

  const link = `${BASE_URL}/reservation`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "¡Bienvenido a La Vieja Adventures!",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:system-ui,sans-serif;background:#f4f4f5;margin:0;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #e4e4e7">
    <h1 style="font-size:20px;font-weight:700;color:#18181b;margin:0 0 8px">¡Tu cuenta fue creada con éxito!</h1>
    <p style="color:#52525b;font-size:15px;margin:0 0 24px">Hola ${name}, gracias por registrarte en La Vieja Adventures. Ya puedes explorar nuestras aventuras y reservar tu próxima experiencia con nosotros.</p>
    <a href="${link}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px">Ver tours y reservar</a>
    <p style="color:#a1a1aa;font-size:12px;margin:24px 0 0">Si no reconoces este registro, por favor responde este correo para ayudarte a proteger tu cuenta.</p>
  </div>
</body>
</html>`,
  });

  if (error) console.error("sendUserWelcomeEmail error:", error);
}
