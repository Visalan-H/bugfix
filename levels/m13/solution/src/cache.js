const clock = require('./clock');

const TTL_SECONDS = 30;
const store = new Map();
const stats = { hits: 0, misses: 0 };

function middleware(req, res, next) {
  const key = req.url;
  const hit = store.get(key);
  if (hit && hit.expires > clock.now()) {
    stats.hits++;
    req.cached = hit.value;
  } else {
    stats.misses++;
  }
  req.cacheKey = key;
  next();
}

function put(key, value) {
  store.set(key, { value, expires: clock.now() + TTL_SECONDS * 1000 });
}

module.exports = { middleware, put, clear: () => store.clear(), stats };
