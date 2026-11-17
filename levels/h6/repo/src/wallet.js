const db = require('memdb');
const ledger = db.collection('ledger');

class HttpError extends Error { constructor(status, m) { super(m); this.status = status; } }
const positiveInt = (n) => Number.isInteger(n) && n > 0;

async function balance(walletId) {
  const entries = await ledger.find({ walletId });
  return entries.reduce((s, e) => s + e.amount, 0);
}

async function topUp(walletId, amount, key) {
  const seen = new Map();
  if (!positiveInt(amount)) throw new HttpError(400, 'amount must be a positive integer (paise)');
  if (key && seen.has(key)) return { entry: seen.get(key), replay: true };
  const entry = await ledger.insert({ walletId, type: 'credit', reason: 'topup', amount });
  if (key) seen.set(key, entry);
  return { entry, replay: false };
}

async function pay(walletId, amount) {
  if (!positiveInt(amount)) throw new HttpError(400, 'bad amount');
  return ledger.insert({ walletId, type: 'debit', reason: 'payment', amount });
}

async function refund(paymentId, amount) {
  if (!positiveInt(amount)) throw new HttpError(400, 'bad amount');
  const payment = await ledger.findOne({ _id: paymentId, reason: 'payment' });
  if (!payment) throw new HttpError(404, 'payment not found');
  return ledger.insert({ walletId: payment.walletId, type: 'credit', reason: 'refund', paymentId, amount });
}

module.exports = { balance, topUp, pay, refund };
