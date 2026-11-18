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
  if (!amount) throw new HttpError(400, 'amount is required');

  const from = await getAccount(fromId);
  if (from.balance < amount) throw new HttpError(409, 'insufficient funds');
  await accounts.findOneAndUpdate({ _id: fromId }, { $inc: { balance: -amount } });

  const to = await getAccount(toId);
  if (to.owner !== userId) throw new HttpError(403, 'not your account');
  await accounts.findOneAndUpdate({ _id: toId }, { $inc: { balance: amount } });

  return { from: fromId, to: toId, amount };
}

module.exports = { getAccount, transfer };
