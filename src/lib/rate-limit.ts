/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for a single Node process (MVP). Swap for Redis/Upstash in
 * multi-instance production deployments.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

// Periodically drop stale buckets so memory stays bounded.
const CLEANUP_INTERVAL_MS = 5 * 60_000;
let lastCleanup = Date.now();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { ok: boolean; remaining: number } {
  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    lastCleanup = now;
    for (const [k, b] of buckets) {
      if (b.timestamps.length === 0 || b.timestamps[b.timestamps.length - 1] < now - windowMs) {
        buckets.delete(k);
      }
    }
  }

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }
  bucket.timestamps = bucket.timestamps.filter((t) => t > now - windowMs);
  if (bucket.timestamps.length >= limit) {
    return { ok: false, remaining: 0 };
  }
  bucket.timestamps.push(now);
  return { ok: true, remaining: limit - bucket.timestamps.length };
}
