import { escapeHtml, layout, sendEmail } from "./send";

/**
 * Confirms that a PIN was set for a mundial player. The caller rolls back the
 * identity document when this throws, so failures must not be swallowed.
 */
export async function sendMundialPinConfiguredEmail({
  email,
  playerName,
  migrated,
}: {
  email: string;
  playerName: string;
  migrated?: boolean;
}) {
  return sendEmail({
    to: email,
    subject: migrated ? "Tu PIN del Mundial fue migrado" : "Tu PIN del Mundial está listo",
    html: layout(
      migrated ? "PIN migrado" : "PIN configurado",
      `<p>Hola ${escapeHtml(playerName)},</p>
       <p>${
         migrated
           ? "Migramos tu cuenta al nuevo sistema de identidad y tu PIN quedó asociado a tu cédula."
           : "Tu PIN quedó configurado y ya podés guardar tus predicciones."
       }</p>
       <p>Si no fuiste vos, respondé este correo de inmediato.</p>`
    ),
  });
}
