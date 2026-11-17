const db = require('memdb');
const items = db.collection('items');

const SEED = [
  ['iPhone 15', 'Apple', 79900], ['AirPods', 'Apple', 12900], ['Galaxy S24', 'Samsung', 74999],
  ['Galaxy Buds', 'Samsung', 9999], ['Pixel 8', 'Google', 75999], ['Apple Pencil', 'Apple', 9500],
  ['Echo Dot', 'Amazon', 4499], ['Kindle', 'Amazon', 13999],
];
const ready = Promise.all(SEED.map(([name, brand, price]) => items.insert({ name, brand, price })));

class HttpError extends Error { constructor(status, m) { super(m); this.status = status; } }
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function search(q) {
  await ready;
  const page = q.page === undefined ? 1 : Number(q.page);
  if (!Number.isInteger(page) || page < 1) throw new HttpError(400, 'page must be an integer >= 1');
  const size = Number(q.size) || 3;

  const filter = {};
  const price = {};
  if (q.minPrice !== undefined) price.$gte = Number(q.minPrice);
  if (q.maxPrice !== undefined) price.$lte = Number(q.maxPrice);
  if (Object.keys(price).length) filter.price = price;
  if (q.brand) filter.brand = { $regex: `^${escape(q.brand)}$`, $options: 'i' };

  const all = await items.find(filter);
  return { total: all.length, page, items: all.slice((page - 1) * size, page * size) };
}

module.exports = { search, HttpError };
