/** Fallback sender used when SMTP_FROM / EMAIL_FROM are not configured. */
export const EMAIL_FROM_DEFAULT =
  process.env.EMAIL_FROM?.trim() || "onboarding@resend.dev";
