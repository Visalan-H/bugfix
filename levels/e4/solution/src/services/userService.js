const repo = require('../repositories/userRepo');
const { hash } = require('../lib/hash');
const { ValidationError, ConflictError, NotFoundError } = require('../errors');

const EDITABLE = ['name', 'bio'];

function toPublic(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

function pick(obj, fields) {
  const out = {};
  for (const f of fields) if (obj[f] !== undefined) out[f] = obj[f];
  return out;
}

async function signup({ email, password, name }) {
  if (!email || !password || !name) throw new ValidationError('email, password and name are required');
  email = email.trim().toLowerCase();

  const existing = await repo.findByEmail(email);
  if (existing) throw new ConflictError('email already registered');

  const user = await repo.insert({ email, name, bio: '', role: 'user', passwordHash: hash(password) });
  return toPublic(user);
}

async function getProfile(id) {
  const user = await repo.findById(id);
  if (!user) throw new NotFoundError('user not found');
  return toPublic(user);
}

async function updateProfile(id, changes) {
  const user = await repo.findById(id);
  if (!user) throw new NotFoundError('user not found');
  const updated = await repo.update(id, pick(changes, EDITABLE));
  return toPublic(updated);
}

module.exports = { signup, getProfile, updateProfile };
