const clock = require('../lib/clock');

// Sliding-window limiter. In prod this state lives in Redis.
module.exports = function rateLimit({ limit, windowMs }) {
  const buckets = new Map(); // key -> [timestamps]

  return function rateLimitMiddleware(req, res, next) {
    const key = req.get('x-api-key');
    const now = clock.now();

    const hits = (buckets.get(key) || []).filter((t) => t > now - windowMs);
    buckets.set(key, hits);

    if (hits.length >= limit) {
      const retryAfter = Math.ceil((hits[0] + windowMs - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'rate limit exceeded' });
    }
    hits.push(now);
    next();
  };
};
