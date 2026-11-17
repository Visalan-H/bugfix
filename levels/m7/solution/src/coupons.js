const db = require('memdb');
const clock = require('./clock');
const CATALOG = require('./catalog');

const redemptions = db.collection('redemptions');
const DAY_MS = 24 * 60 * 60 * 1000;

class Reject extends Error { constructor(m) { super(m); this.status = 400; } }

async function checkout(userId, code, orderTotal) {
  const c = CATALOG[code];
  if (!c) throw new Reject('unknown coupon');
  if (clock.now() >= Date.parse(c.validUntil) + DAY_MS) throw new Reject('coupon expired');
  if (c.minOrder && orderTotal < c.minOrder) throw new Reject(`minimum order is ${c.minOrder}`);

  if (c.perUser) {
    const used = await redemptions.count({ code: c.code, userId });
    if (used >= c.perUser) throw new Reject('already used');
  }

  const discount = c.flat ? c.flat : Math.min(orderTotal * c.percent / 100, c.maxDiscount ?? Infinity);
  await redemptions.insert({ code: c.code, userId, at: clock.now() });
  return { discount, total: orderTotal - discount };
}

module.exports = { checkout };
