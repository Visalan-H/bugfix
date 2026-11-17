const db = require('memdb');
const accounts = db.collection('accounts');

const ready = Promise.all([
  accounts.insert({ _id: 'acc-a', owner: 'u1', balance: 1000 }),
  accounts.insert({ _id: 'acc-b', owner: 'u2', balance: 500 }),
]);

class HttpError extends Error { constructor(status, m) { super(m); this.status = status; } }

async function getAccount(id) {
  await ready;
  const a = await accounts.findById(id);
  if (!a) throw new HttpError(404, 'account not found');
  return { id: a._id, owner: a.owner, balance: a.balance };
}

async function transfer(userId, fromId, toId, amount) {
  if (typeof amount !== 'number' || !(amount > 0)) throw new HttpError(400, 'amount must be a positive number');
  if (fromId === toId) throw new HttpError(400, 'cannot transfer to the same account');

  const from = await getAccount(fromId);
  const to = await getAccount(toId);
  if (from.owner !== userId) throw new HttpError(403, 'not your account');

  const debited = await accounts.findOneAndUpdate({ _id: fromId, balance: { $gte: amount } }, { $inc: { balance: -amount } });
  if (!debited) throw new HttpError(409, 'insufficient funds');
  await accounts.findOneAndUpdate({ _id: to.id }, { $inc: { balance: amount } });

  return { from: fromId, to: toId, amount };
}

module.exports = { getAccount, transfer };
