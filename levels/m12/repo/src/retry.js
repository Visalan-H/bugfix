const BASE_MS = 1000;
const MAX_DELAY_MS = 5000;
const MAX_ATTEMPTS = 5;

function afterFailure(attempts) {
  if (attempts > MAX_ATTEMPTS) return { status: 'dead', nextRetryMs: null };
  const delay = BASE_MS * 2 ^ (attempts - 1);
  return { status: 'pending', nextRetryMs: Math.max(delay, MAX_DELAY_MS) };
}

module.exports = { afterFailure };
