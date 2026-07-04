// Best-effort in-memory rate limiter, keyed by client IP.
//
// Caveat: on serverless (Vercel), each warm instance has its own memory, so a
// distributed attacker spread across instances isn't fully bounded here. This
// is defence-in-depth that stops the common case — one client hammering the
// endpoint — cheaply and with zero dependencies. For a hard global limit, put
// a Vercel Firewall rate-limit rule in front of /api/subscribe, or back this
// with Upstash/Vercel KV. See SECURITY.md.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: boolean; retryAfterSec: number };

/**
 * Fixed-window limiter. Allows `limit` hits per `windowSec` per key.
 * Sweeps expired buckets opportunistically so the map can't grow unbounded.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSec * 1000;

  // Opportunistic cleanup — cheap, bounded by map size.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

/** Extract the best-guess client IP from a request's forwarding headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
