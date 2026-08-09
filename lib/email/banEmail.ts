import { codeBlock, escapeHtml, layout, sendEmail } from "./send";

type CodeEmail = {
  to: string;
  playerName: string;
  code: string;
  ticketId: string;
};

export async function sendEmailVerificationCode({ to, playerName, code, ticketId }: CodeEmail) {
  return sendEmail({
    to,
    subject: `Código de verificación — ticket ${ticketId}`,
    html: layout(
      "Verificá tu correo",
      `<p>Hola ${escapeHtml(playerName)}, este es tu código para continuar con la apelación:</p>
       ${codeBlock(code)}
       <p>Vence en 15 minutos. Ticket <strong>${escapeHtml(ticketId)}</strong>.</p>`
    ),
  });
}

export async function sendPhoneVerificationCode({
  to,
  playerName,
  code,
  phone,
  ticketId,
}: CodeEmail & { phone: string }) {
  return sendEmail({
    to,
    subject: `Código para el teléfono ${phone} — ticket ${ticketId}`,
    html: layout(
      "Verificá tu teléfono",
      `<p>Hola ${escapeHtml(playerName)}, código para confirmar el número <strong>${escapeHtml(phone)}</strong>:</p>
       ${codeBlock(code)}
       <p>Vence en 15 minutos. Ticket <strong>${escapeHtml(ticketId)}</strong>.</p>`
    ),
  });
}

export async function sendTicketConfirmation({
  to,
  playerName,
  ticketId,
}: Omit<CodeEmail, "code">) {
  return sendEmail({
    to,
    subject: `Apelación recibida — ticket ${ticketId}`,
    html: layout(
      "Recibimos tu apelación",
      `<p>Hola ${escapeHtml(playerName)}, tu solicitud quedó registrada con el ticket
       <strong>${escapeHtml(ticketId)}</strong>.</p>
       <p>Un administrador la revisará y te avisaremos por este mismo correo.</p>`
    ),
  });
}
