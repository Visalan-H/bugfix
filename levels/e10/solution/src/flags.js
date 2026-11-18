const FLAGS = require('./config');

function hash(s) {
  return [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
}

function isEnabled(name, userId) {
  const flag = FLAGS[name];
  if (!flag) return false;
  const on = flag.enabled === true || flag.enabled === 'true';
  if (!on) return false;
  const bucket = (hash(String(userId)) >>> 0) % 100;
  return bucket < flag.rollout;
}

module.exports = { isEnabled, hash };
