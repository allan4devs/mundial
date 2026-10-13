/** Fallback sender used when SMTP_FROM / EMAIL_FROM are not configured. */
export const EMAIL_FROM_DEFAULT =
  process.env.EMAIL_FROM?.trim() || "onboarding@resend.dev";
export const APP_BASE_URL_DEFAULT = "http://localhost:3000";
export function getEmailFrom() { return EMAIL_FROM_DEFAULT; }
