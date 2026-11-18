const products = require('../data/products');

const DEFAULT_LIMIT = 3;

function sortProducts(items, sort) {
  if (sort === 'price_asc') {
    return items.sort((a, b) => a.price > b.price);
  }
  if (sort === 'price_desc') {
    return items.sort((a, b) => a.price < b.price);
  }
  return items;
}

function listProducts({ page, limit, sort, category }) {
  page = page || 1;
  limit = limit || DEFAULT_LIMIT;

  let items = category ? products.filter((p) => p.category === category) : products;
  items = sortProducts(items, sort);

  const total = items.length;
  const skip = page * limit;
  const data = items.slice(skip, skip + limit);

  return { data, page: Number(page), limit: Number(limit), total };
}

module.exports = { listProducts };
