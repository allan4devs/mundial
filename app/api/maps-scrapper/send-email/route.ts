import { NextResponse } from "next/server";
import { Resend } from "resend";
import { EMAIL_FROM_DEFAULT } from "@/lib/constants/email";
import { getDb } from "@/lib/mongo";

export const runtime = "nodejs";

const LEADS_COLLECTION = "maps_scrapper_leads";

// Best-effort: flag the saved lead so the scrapper UI can show an "already
// emailed" check across sessions. Never block the send if this fails.
async function markLeadEmailed(businessId: string, to: string) {
  try {
    const db = await getDb();
    const now = new Date();
    await db
      .collection(LEADS_COLLECTION)
      .updateOne({ id: businessId }, { $set: { emailedAt: now, emailedTo: to, updatedAt: now } });
  } catch (error) {
    console.error("[maps-scrapper/send-email] no se pudo marcar el lead", error);
  }
}

// Cold prospecting replies should land in the sales/admin inbox, not the
// no-reply transactional sender. Overridable via env if the inbox changes.
const REPLY_TO = process.env.MAPS_PITCH_REPLY_TO || "ciudadesmeraldacr@gmail.com";
const FROM = process.env.SMTP_FROM || EMAIL_FROM_DEFAULT;

const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

type SendPitchPayload = {
  to?: string;
  subject?: string;
  body?: string;
  businessName?: string;
  businessId?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// The AI pitch body is plain text with \n line breaks. Wrap it in a light,
// readable HTML shell so it renders well in email clients.
function buildPitchHtml(body: string) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((block) => escapeHtml(block).replace(/\n/g, "<br />"))
    .filter((block) => block.trim().length > 0)
    .map(
      (block) =>
        `<p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px">${block}</p>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#f4f4f5;margin:0;padding:32px 16px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:36px 40px;border:1px solid #e4e4e7">
    ${paragraphs}
  </div>
</body>
</html>`;
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY no está configurada." },
      { status: 500 },
    );
  }

  let payload: SendPitchPayload;
  try {
    payload = (await request.json()) as SendPitchPayload;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const to = payload.to?.trim().toLowerCase() ?? "";
  const subject = payload.subject?.trim() ?? "";
  const body = payload.body?.trim() ?? "";

  if (!EMAIL_PATTERN.test(to)) {
    return NextResponse.json(
      { error: "Correo del destinatario inválido." },
      { status: 400 },
    );
  }
  if (!subject) {
    return NextResponse.json({ error: "Falta el asunto." }, { status: 400 });
  }
  if (!body) {
    return NextResponse.json({ error: "Falta el mensaje." }, { status: 400 });
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject,
    html: buildPitchHtml(body),
    text: body,
  });

  if (error) {
    console.error("[maps-scrapper/send-email]", error);
    return NextResponse.json(
      { error: error.message || "No se pudo enviar el correo." },
      { status: 502 },
    );
  }

  const businessId = payload.businessId?.trim();
  if (businessId) {
    await markLeadEmailed(businessId, to);
  }

  return NextResponse.json({ sent: true, id: data?.id ?? null });
}
