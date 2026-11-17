const db = require('memdb');
const orders = db.collection('orders');

class HttpError extends Error { constructor(status, m) { super(m); this.status = status; } }

const ALLOWED = {
  placed: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

async function create(userId) {
  return orders.insert({ userId, status: 'placed', history: ['placed'] });
}

async function transition(id, to, role) {
  if (!Object.prototype.hasOwnProperty.call(ALLOWED, to)) throw new HttpError(400, 'unknown status');
  const order = await orders.findById(id);
  if (!order) throw new HttpError(404, 'order not found');
  if (role !== 'staff' && to !== 'cancelled') throw new HttpError(403, 'customers can only cancel');
  if (!ALLOWED[order.status].includes(to)) throw new HttpError(409, `cannot go from ${order.status} to ${to}`);
  return orders.updateById(id, { status: to, history: [...order.history, to] });
}

module.exports = { create, transition };
