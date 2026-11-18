const db = require('memdb');

const users = db.collection('users');
const referrers = db.collection('referrers');
const CAP = 3;
const ready = referrers.insert({ _id: 'RAVI100', rewards: 2, balance: 200 });

class HttpError extends Error { constructor(status, m) { super(m); this.status = status; } }

async function signup(email, referralCode) {
  await ready;
  const key = String(email || '').trim().toLowerCase();
  if (!key.includes('@')) throw new HttpError(400, 'valid email required');
  if (await users.findOne({ email: key })) throw new HttpError(409, 'email already registered');

  let referredBy = null;
  if (referralCode) {
    const code = String(referralCode).trim().toUpperCase();
    if (await referrers.findById(code)) referredBy = code;
  }

  await users.insert({ email: key, referredBy });

  if (referredBy) {
    await referrers.findOneAndUpdate({ _id: referredBy, rewards: { $lt: CAP } }, { $inc: { rewards: 1, balance: 100 } });
  }
  return { email: key, referredBy };
}

async function referrer(code) {
  await ready;
  const r = await referrers.findById(String(code).toUpperCase());
  if (!r) throw new HttpError(404, 'not found');
  return { rewards: r.rewards, balance: r.balance };
}

module.exports = { signup, referrer };
