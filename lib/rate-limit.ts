// Basic in-memory per-key throttle. Resets on cold start and isn't shared
// across serverless instances — not bulletproof, just not free to script
// against a single warm instance. Good enough for a low-stakes public
// lookup endpoint; not a substitute for real rate limiting if this pattern
// gets reused somewhere higher-stakes.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
}
