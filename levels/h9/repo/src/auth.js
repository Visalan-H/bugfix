const clock = require('./clock');
const users = require('./users');
const { sign, unb64 } = require('./token');

module.exports = function auth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing token' });

  const [body, sig] = token.split('.');
  if (!sig || !sign(body)) return res.status(401).json({ error: 'bad signature' });

  let payload;
  try { payload = JSON.parse(unb64(body)); } catch (e) { return res.status(401).json({ error: 'bad token' }); }
  if (clock.now() > payload.exp) return res.status(401).json({ error: 'token expired' });

  req.user = { id: payload.sub, role: payload.role };
  next();
};
