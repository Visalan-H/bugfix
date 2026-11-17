const db = require('memdb');
const products = db.collection('products');

const ready = Promise.all([
  products.insert({ _id: 'p-echo', name: 'Echo Dot', price: 49.99, stock: 5 }),
  products.insert({ _id: 'p-cable', name: 'USB-C Cable', price: 9.99, stock: 2 }),
  products.insert({ _id: 'p-kindle', name: 'Kindle', price: 139.99, stock: 1 }),
]);

exports.findById = async (id) => { await ready; return products.findById(id); };

exports.setStock = async (id, stock) => { await ready; return products.updateById(id, { stock }); };

// Atomic: only decrements if enough stock. Returns the updated product, or null.
exports.decrementIfAvailable = async (id, qty) => {
  await ready;
  return products.findOneAndUpdate({ _id: id, stock: { $gte: qty } }, { $inc: { stock: -qty } });
};

exports.increment = async (id, qty) => {
  await ready;
  return products.findOneAndUpdate({ _id: id }, { $inc: { stock: qty } });
};
