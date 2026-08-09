import { escapeHtml, layout, sendEmail } from "./send";

export async function sendPremiumWelcomeEmail({
  to,
  playerName,
}: {
  to: string;
  playerName: string;
}) {
  return sendEmail({
    to,
    subject: "¡Bienvenido a Mundial Premium!",
    html: layout(
      "Pago confirmado",
      `<p>Hola ${escapeHtml(playerName)},</p>
       <p>Tu pago se procesó correctamente y ya tenés acceso premium: predicciones de
       jugadores, apuestas de estadísticas y el pool completo.</p>
       <p>¡Suerte con la quiniela!</p>`
    ),
  });
}
