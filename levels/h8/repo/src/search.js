const db = require('memdb');
const items = db.collection('items');

const SEED = [
  ['iPhone 15', 'Apple', 79900], ['AirPods', 'Apple', 12900], ['Galaxy S24', 'Samsung', 74999],
  ['Galaxy Buds', 'Samsung', 9999], ['Pixel 8', 'Google', 75999], ['Apple Pencil', 'Apple', 9500],
  ['Echo Dot', 'Amazon', 4499], ['Kindle', 'Amazon', 13999],
];
const ready = Promise.all(SEED.map(([name, brand, price]) => items.insert({ name, brand, price })));

class HttpError extends Error { constructor(status, m) { super(m); this.status = status; } }

async function search(q) {
  await ready;
  const page = q.page === undefined ? 1 : Number(q.page);
  const size = Number(q.size) || 3;

  const filter = {};
  if (q.minPrice !== undefined) filter.price = { $gte: Number(q.minPrice) };
  if (q.maxPrice !== undefined) filter.price = { $lte: Number(q.maxPrice) };
  if (q.brand) filter.brand = q.brand;

  const all = await items.find(filter);
  const pageItems = all.slice((page - 1) * size, page * size);
  return { total: pageItems.length, page, items: pageItems };
}

module.exports = { search, HttpError };
