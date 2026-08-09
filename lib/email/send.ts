import { Resend } from "resend";

import { EMAIL_FROM_DEFAULT } from "../constants/email";

const FROM = process.env.SMTP_FROM || EMAIL_FROM_DEFAULT;

let client: Resend | null = null;

function resend() {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) throw new Error("RESEND_API_KEY env var is not set");
    client = new Resend(apiKey);
  }
  return client;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sends a transactional email and throws on failure — callers such as the
 * mundial PIN route roll back their writes when delivery does not succeed.
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const { data, error } = await resend().emails.send({
    from: FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
  });

  if (error) {
    throw new Error(`Email delivery failed: ${error.message ?? String(error)}`);
  }

  return data;
}

/** Minimal shared shell so every transactional email looks consistent. */
export function layout(title: string, bodyHtml: string) {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#0a0a0b;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#141417;border-radius:16px;padding:32px;">
          <tr><td>
            <h1 style="margin:0 0 16px;font-size:20px;color:#fafafa;">${escapeHtml(title)}</h1>
            <div style="font-size:15px;line-height:1.6;color:#c7c7cc;">${bodyHtml}</div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function codeBlock(code: string) {
  return `<p style="margin:24px 0;text-align:center;">
    <span style="display:inline-block;padding:14px 28px;background:#1f1f24;border-radius:12px;font-family:ui-monospace,monospace;font-size:28px;letter-spacing:6px;color:#fafafa;">${escapeHtml(code)}</span>
  </p>`;
}
