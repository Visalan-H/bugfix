const db = require('memdb');
const files = db.collection('files');
const usage = db.collection('usage');

const QUOTA_KB = 1024;
class HttpError extends Error { constructor(status, m) { super(m); this.status = status; } }

async function getUsage(userId) {
  return (await usage.findById(userId)) || usage.insert({ _id: userId, usedKb: 0 });
}

async function put(userId, name, sizeKb) {
  if (!Number.isInteger(sizeKb) || sizeKb <= 0) throw new HttpError(400, 'sizeKb must be a positive integer');
  const u = await getUsage(userId);
  if (u.usedKb > QUOTA_KB) throw new HttpError(413, 'quota exceeded');

  const existing = await files.findOne({ userId, name });
  if (existing) await files.updateById(existing._id, { sizeKb });
  else await files.insert({ userId, name, sizeKb });
  await usage.findOneAndUpdate({ _id: userId }, { $inc: { usedKb: sizeKb } });
}

async function remove(userId, name) {
  const file = await files.findOne({ userId, name });
  if (!file) throw new HttpError(404, 'not found');
  await files.deleteById(file._id);
  const u = await getUsage(userId);
  u.usedKb -= file.sizeKb;
}

async function report(userId) {
  const u = await getUsage(userId);
  return { usedKb: u.usedKb, quotaKb: QUOTA_KB };
}

module.exports = { put, remove, report };
