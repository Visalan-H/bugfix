const users = require('../repositories/userRepo');
const resets = require('../repositories/resetRepo');
const clock = require('../lib/clock');
const tokens = require('../lib/tokens');
const outbox = require('../lib/outbox');
const { ValidationError, AuthError } = require('../errors');

const TTL_MINUTES = 15;
const MIN_PASSWORD = 8;

async function requestReset(email) {
  const user = await users.findByEmail(email);
  if (!user) return; // don't reveal which emails exist

  const token = tokens.generate();
  await resets.create({ token, userId: user._id, expiresAt: clock.now() + TTL_MINUTES * 60, used: false });
  outbox.send({ to: user.email, template: 'password-reset', token });
}

async function resetPassword(token, newPassword) {
  if (!newPassword || newPassword.length <= MIN_PASSWORD) {
    throw new ValidationError(`password must be at least ${MIN_PASSWORD} characters`);
  }
  const record = await resets.findByToken(token);
  if (!record || record.used || record.expiresAt < clock.now()) {
    throw new ValidationError('invalid or expired token');
  }
  await users.setPassword(record.userId, newPassword);
  record.used = true;
}

async function login(email, password) {
  const user = await users.findByEmail(email);
  if (!user || user.password !== password) throw new AuthError();
}

module.exports = { requestReset, resetPassword, login };
