import { Resend } from "resend";
import { getEmailFrom } from "@/lib/constants/email";
import type { ConversationSession } from "@/lib/conversation/types";

const ADMIN_EMAIL = "aallanrd@gmail.com";
const FROM = getEmailFrom();

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "Pendiente")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function row(label: string, value: string | number | null | undefined) {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #eee;color:#78716c">${escapeHtml(label)}</td>
    <td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:700;color:#2E2A25">${escapeHtml(value)}</td>
  </tr>`;
}

export async function sendConversationFollowupEmail(session: ConversationSession) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[conversation/followup] RESEND_API_KEY not set — notification not sent");
    return { sent: false as const, reason: "unconfigured" };
  }

  const resend = new Resend(apiKey);
  const reservation = session.reservation;
  const visitorName = session.customer.name || reservation.name || "Visitante sin nombre";
  const visitorPhone = session.customer.phone || reservation.phone;
  const subject = `Vero: seguimiento humano — ${visitorName}`;
  const idempotencyKey = `vero-human-${session.sessionId}-${session.createdAt.getTime()}`;

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [ADMIN_EMAIL],
    subject,
    html: `<!doctype html>
<html lang="es">
  <head><meta charset="utf-8"></head>
  <body style="margin:0;padding:32px 16px;background:#f5f3ef;font-family:Arial,sans-serif">
    <div style="max-width:620px;margin:0 auto;overflow:hidden;border:1px solid #e7e5e4;border-radius:20px;background:#fff">
      <div style="padding:24px 28px;background:#2E2A25;color:#fff">
        <p style="margin:0 0 6px;color:#74e3d7;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">Vero · La Vieja Adventures</p>
        <h1 style="margin:0;font-size:22px">Nueva solicitud de seguimiento</h1>
      </div>
      <div style="padding:26px 28px">
        <p style="margin:0 0 20px;color:#57534e;line-height:1.6">Un visitante pidió continuar con una persona del equipo. Los datos capturados hasta ahora quedan resumidos abajo.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          ${row("Nombre", visitorName)}
          ${row("Teléfono", visitorPhone)}
          ${row("Correo", reservation.email)}
          ${row("Tour", reservation.tour)}
          ${row("Fecha", reservation.date)}
          ${row("Horario preferido", reservation.time)}
          ${row("Personas", reservation.people)}
          ${row("Edades", reservation.ages.length ? reservation.ages.join(", ") : null)}
          ${row("Condición física", reservation.fitness)}
          ${row("Paquete", reservation.package)}
          ${row("Transporte", reservation.transport)}
          ${row("Almuerzo", reservation.lunch)}
          ${row("Sesión", session.sessionId)}
        </table>
        ${visitorPhone ? `<a href="https://wa.me/${escapeHtml(visitorPhone.replace(/\D/g, ""))}" style="display:inline-block;margin-top:22px;padding:12px 20px;border-radius:999px;background:#00C4B0;color:#173d38;text-decoration:none;font-size:14px;font-weight:800">Contactar por WhatsApp</a>` : ""}
        <p style="margin:22px 0 0;color:#a8a29e;font-size:12px">La solicitud todavía no representa una reserva confirmada ni pagada.</p>
      </div>
    </div>
  </body>
</html>`,
  }, { idempotencyKey });

  if (error) {
    console.error("[conversation/followup] Resend error", error);
    return { sent: false as const, reason: error.message };
  }

  return { sent: true as const, id: data?.id ?? null, recipient: ADMIN_EMAIL };
}
