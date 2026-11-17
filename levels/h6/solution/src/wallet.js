const db = require('memdb');
const ledger = db.collection('ledger');

class HttpError extends Error { constructor(status, m) { super(m); this.status = status; } }
const positiveInt = (n) => Number.isInteger(n) && n > 0;

async function balance(walletId) {
  const entries = await ledger.find({ walletId });
  return entries.reduce((s, e) => s + (e.type === 'debit' ? -e.amount : e.amount), 0);
}

async function topUp(walletId, amount, key) {
  if (!positiveInt(amount)) throw new HttpError(400, 'amount must be a positive integer (paise)');
  if (key) {
    const existing = await ledger.findOne({ walletId, idempotencyKey: key });
    if (existing) return { entry: existing, replay: true };
  }
  const entry = await ledger.insert({ walletId, type: 'credit', reason: 'topup', amount, idempotencyKey: key || null });
  return { entry, replay: false };
}

async function pay(walletId, amount) {
  if (!positiveInt(amount)) throw new HttpError(400, 'bad amount');
  if ((await balance(walletId)) < amount) throw new HttpError(409, 'insufficient funds');
  return ledger.insert({ walletId, type: 'debit', reason: 'payment', amount });
}

async function refund(paymentId, amount) {
  if (!positiveInt(amount)) throw new HttpError(400, 'bad amount');
  const payment = await ledger.findOne({ _id: paymentId, reason: 'payment' });
  if (!payment) throw new HttpError(404, 'payment not found');
  const refunds = await ledger.find({ paymentId, reason: 'refund' });
  const already = refunds.reduce((s, r) => s + r.amount, 0);
  if (already + amount > payment.amount) throw new HttpError(400, 'refund exceeds payment');
  return ledger.insert({ walletId: payment.walletId, type: 'credit', reason: 'refund', paymentId, amount });
}

module.exports = { balance, topUp, pay, refund };
