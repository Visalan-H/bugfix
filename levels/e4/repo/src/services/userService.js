const repo = require('../repositories/userRepo');
const { hash } = require('../lib/hash');
const { ValidationError, ConflictError, NotFoundError } = require('../errors');

function toPublic(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

async function signup({ email, password, name }) {
  if (!email || !password || !name) throw new ValidationError('email, password and name are required');

  const existing = repo.findByEmail(email);
  if (existing) throw new ConflictError('email already registered');

  const user = await repo.insert({ email, name, bio: '', role: 'user', passwordHash: hash(password) });
  const { passwordHash, ...safe } = user;
  return user;
}

async function getProfile(id) {
  const user = await repo.findById(id);
  if (!user) throw new NotFoundError('user not found');
  return toPublic(user);
}

async function updateProfile(id, changes) {
  const user = await repo.findById(id);
  if (!user) throw new NotFoundError('user not found');
  const updated = await repo.update(id, changes);
  return toPublic(updated);
}

module.exports = { signup, getProfile, updateProfile };
