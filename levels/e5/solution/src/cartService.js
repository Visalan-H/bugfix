const db = require('memdb');
const { PRICES, COUPONS } = require('./catalog');

const carts = db.collection('carts');

async function getCart(userId) {
  const cart = await carts.findOne({ userId });
  return cart || carts.insert({ userId, items: [], coupon: null });
}

function summary(cart) {
  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const coupon = cart.coupon ? COUPONS[cart.coupon] : null;
  const discount = coupon ? subtotal * coupon.percent / 100 : 0;
  return { items: cart.items, subtotal, discount, total: subtotal - discount };
}

async function addItem(userId, sku, qty) {
  const cart = await getCart(userId);
  const existing = cart.items.find((i) => i.sku === sku);
  if (existing) existing.qty += qty;
  else cart.items.push({ sku, qty, price: PRICES[sku] });
  await carts.updateById(cart._id, { items: cart.items });
  return summary(cart);
}

async function view(userId) {
  return summary(await getCart(userId));
}

async function applyCoupon(userId, code) {
  const key = String(code || '').trim().toUpperCase();
  if (!COUPONS[key]) return null;
  const cart = await getCart(userId);
  cart.coupon = key;
  await carts.updateById(cart._id, { coupon: key });
  return summary(cart);
}

module.exports = { addItem, view, applyCoupon };
