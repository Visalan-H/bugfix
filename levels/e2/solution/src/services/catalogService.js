const products = require('../data/products');

const DEFAULT_LIMIT = 3;

function sortProducts(items, sort) {
  if (sort === 'price_asc') {
    return [...items].sort((a, b) => a.price - b.price);
  }
  if (sort === 'price_desc') {
    return [...items].sort((a, b) => b.price - a.price);
  }
  return items;
}

function listProducts({ page, limit, sort, category }) {
  page = Number(page) || 1;
  limit = Number(limit) || DEFAULT_LIMIT;

  let items = category ? products.filter((p) => p.category === category) : products;
  items = sortProducts(items, sort);

  const total = items.length;
  const skip = (page - 1) * limit;
  const data = items.slice(skip, skip + limit);

  return { data, page, limit, total };
}

module.exports = { listProducts };
