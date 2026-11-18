const productRepo = require('../repositories/productRepo');
const orderRepo = require('../repositories/orderRepo');
const { ValidationError, NotFoundError, ConflictError } = require('../errors');

async function placeOrder(userId, items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('items must be a non-empty array');
  }

  let total = 0;
  const lines = [];

  for (const { productId, qty } of items) {
    if (!Number.isInteger(qty) || qty <= 0) throw new ValidationError('qty must be a positive integer');

    const product = await productRepo.findById(productId);
    if (!product) throw new NotFoundError('Product');
    if (product.stock < qty) throw new ConflictError(`${product.name} is out of stock`);

    await productRepo.setStock(productId, product.stock - qty);

    total += product.price * qty;
    lines.push({ productId, name: product.name, price: product.price, qty });
  }

  return orderRepo.create({ userId, lines, total: Math.round(total * 100 / 100), status: 'placed' });
}

module.exports = { placeOrder };
