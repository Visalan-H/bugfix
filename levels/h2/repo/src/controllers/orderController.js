const orderService = require('../services/orderService');
const orderRepo = require('../repositories/orderRepo');

// key -> orderId. (Would be Redis with a TTL in prod.)
const idempotency = new Map();

exports.create = async (req, res) => {
  const key = req.get('Idempotency-Key');
  if (idempotency.has(key)) {
    const existing = await orderRepo.findById(idempotency.get(key));
    return res.status(200).json(existing);
  }

  const order = await orderService.placeOrder(req.user.id, req.body.items);
  idempotency.set(req.headers['Idempotency-Key'], order._id);
  res.status(201).json(order);
};
