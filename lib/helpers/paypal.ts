import { PAYPAL_LIVE_API, PAYPAL_SANDBOX_API } from "../constants/paypal";

/** Mirrors app/api/xtreme/checkout/config: server PAYPAL_MODE, client NEXT_PUBLIC_PAYPAL_MODE. */
export function isLivePayPalMode(): boolean {
  const mode = (process.env.PAYPAL_MODE || process.env.NEXT_PUBLIC_PAYPAL_MODE)
    ?.trim()
    .toLowerCase();
  return mode === "live" || mode === "production" || mode === "prod";
}

export function getPayPalApiBaseUrl(): string {
  return isLivePayPalMode() ? PAYPAL_LIVE_API : PAYPAL_SANDBOX_API;
}

type TokenCache = { token: string; expiresAt: number };
let cached: TokenCache | null = null;

/**
 * OAuth2 client-credentials token, cached until a minute before it expires.
 */
export async function getPayPalAccessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const live = isLivePayPalMode();
  const clientId =
    (live ? undefined : process.env.PAYPAL_SANDBOX_CLIENT_ID?.trim()) ||
    process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret =
    (live ? undefined : process.env.PAYPAL_SANDBOX_CLIENT_SECRET?.trim()) ||
    process.env.PAYPAL_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${getPayPalApiBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`PayPal token request failed: ${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("PayPal token response had no access_token");

  const ttlMs = Math.max(((data.expires_in ?? 3600) - 60) * 1000, 60_000);
  cached = { token: data.access_token, expiresAt: Date.now() + ttlMs };
  return cached.token;
}
