/**
 * Resolves a secret that has a usable development fallback but must never fall
 * back in production — a known default would be a shared, public secret.
 *
 * Contract exercised by scripts/test-scores-secrets.mjs.
 */
export function resolveRuntimeSecret(
  name: string,
  configured: string | undefined,
  developmentFallback: string,
  isProduction: boolean = process.env.NODE_ENV === "production"
): string {
  const trimmed = configured?.trim();
  if (trimmed) return trimmed;

  if (isProduction) {
    throw new Error(`${name} is required in production`);
  }

  return developmentFallback;
}
