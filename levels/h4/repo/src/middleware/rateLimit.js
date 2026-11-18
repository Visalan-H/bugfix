const clock = require('../lib/clock');

// Sliding-window limiter. In prod this state lives in Redis.
module.exports = function rateLimit({ limit, windowMs }) {
  const buckets = new Map(); // key -> [timestamps]

  return function rateLimitMiddleware(req, res, next) {
    const key = req.headers['X-Api-Key'];
    const now = clock.now();

    const hits = (buckets.get(key) || []).filter((t) => t < now - windowMs);
    hits.push(now);
    buckets.set(key, hits);

    if (hits.length > limit) {
      const retryAfter = hits[0] + windowMs - now;
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'rate limit exceeded' });
    }
    next();
  };
};
