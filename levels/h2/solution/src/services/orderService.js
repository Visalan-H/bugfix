const productRepo = require('../repositories/productRepo');
const orderRepo = require('../repositories/orderRepo');
const { ValidationError, NotFoundError, ConflictError } = require('../errors');

async function placeOrder(userId, items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('items must be a non-empty array');
  }

  // Phase 1: validate everything before touching stock.
  const lines = [];
  for (const { productId, qty } of items) {
    if (!Number.isInteger(qty) || qty <= 0) throw new ValidationError('qty must be a positive integer');
    const product = await productRepo.findById(productId);
    if (!product) throw new NotFoundError('Product');
    lines.push({ productId, name: product.name, price: product.price, qty });
  }

  // Phase 2: reserve atomically; undo on any failure.
  const reserved = [];
  try {
    for (const line of lines) {
      const ok = await productRepo.decrementIfAvailable(line.productId, line.qty);
      if (!ok) throw new ConflictError(`${line.name} is out of stock`);
      reserved.push(line);
    }
  } catch (err) {
    for (const line of reserved) await productRepo.increment(line.productId, line.qty);
    throw err;
  }

  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  return orderRepo.create({ userId, lines, total: Math.round(total * 100) / 100, status: 'placed' });
}

module.exports = { placeOrder };
