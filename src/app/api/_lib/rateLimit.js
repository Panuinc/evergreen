const buckets = new Map();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRequest > bucket.windowMs * 2) {
      buckets.delete(key);
    }
  }
}

/**
 * Simple in-memory rate limiter.
 * @param {string} key - unique key (e.g. IP + route)
 * @param {object} opts
 * @param {number} opts.maxRequests - max requests per window (default 30)
 * @param {number} opts.windowMs - window in ms (default 60000)
 * @returns {{ allowed: boolean, remaining: number }}
 */
export function rateLimit(key, { maxRequests = 30, windowMs = 60_000 } = {}) {
  cleanup();
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    bucket = { count: 0, windowStart: now, lastRequest: now, windowMs };
    buckets.set(key, bucket);
  }

  bucket.lastRequest = now;
  bucket.count++;

  return {
    allowed: bucket.count <= maxRequests,
    remaining: Math.max(0, maxRequests - bucket.count),
  };
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Returns 429 response if rate limit exceeded.
 * @param {Request} request
 * @param {string} routeName
 * @param {object} opts - { maxRequests, windowMs }
 * @returns {Response|null} - null if allowed, Response if blocked
 */
export function checkRateLimit(request, routeName, opts) {
  const ip = getClientIp(request);
  const key = `${routeName}:${ip}`;
  const { allowed, remaining } = rateLimit(key, opts);

  if (!allowed) {
    return Response.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((opts?.windowMs || 60000) / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }
  return null;
}
