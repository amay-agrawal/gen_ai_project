import { sendError } from '../utils/apiResponse.js';
import { RATE_LIMITS } from '@ai-outreach/shared';
// In-memory token bucket (upgrade to Redis for multi-instance)
const buckets = new Map();
const REFILL_RATE = RATE_LIMITS.API_REQUESTS_PER_MINUTE; // tokens per minute
const BUCKET_SIZE = RATE_LIMITS.API_REQUESTS_PER_MINUTE;
export function rateLimit(req, res, next) {
    const key = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();
    let entry = buckets.get(key);
    if (!entry) {
        entry = { tokens: BUCKET_SIZE, lastRefill: now };
        buckets.set(key, entry);
    }
    // Refill tokens based on elapsed time
    const elapsedMs = now - entry.lastRefill;
    const tokensToAdd = (elapsedMs / 60000) * REFILL_RATE;
    entry.tokens = Math.min(BUCKET_SIZE, entry.tokens + tokensToAdd);
    entry.lastRefill = now;
    if (entry.tokens < 1) {
        const retryAfter = Math.ceil((1 - entry.tokens) / (REFILL_RATE / 60));
        res.setHeader('Retry-After', retryAfter.toString());
        sendError(res, 'RATE_LIMIT_EXCEEDED', `Rate limit exceeded. Try again in ${retryAfter}s`, 429);
        return;
    }
    entry.tokens -= 1;
    res.setHeader('X-RateLimit-Remaining', Math.floor(entry.tokens).toString());
    res.setHeader('X-RateLimit-Limit', BUCKET_SIZE.toString());
    next();
}
// Periodic cleanup of stale entries (every 5 minutes)
setInterval(() => {
    const cutoff = Date.now() - 300000;
    for (const [key, entry] of buckets) {
        if (entry.lastRefill < cutoff) {
            buckets.delete(key);
        }
    }
}, 300000);
//# sourceMappingURL=rateLimit.middleware.js.map