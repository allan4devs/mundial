/** Simple in-memory sliding window rate limit (per process). */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const SWEEP_INTERVAL = 256;
const MAX_BUCKETS = 10_000;
let operations = 0;

function maintainBuckets(now: number) {
  operations += 1;
  if (operations % SWEEP_INTERVAL === 0) {
    for (const [key, bucket] of buckets) {
      if (now >= bucket.resetAt) buckets.delete(key);
    }
  }

  while (buckets.size >= MAX_BUCKETS) {
    const oldestKey = buckets.keys().next().value as string | undefined;
    if (!oldestKey) break;
    buckets.delete(oldestKey);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  maintainBuckets(now);
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, retryAfterSec: 0 };
}
