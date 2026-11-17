const db = require('memdb');
const SEED = require('../data/movies');

const movies = db.collection('movies');
const ready = Promise.all(SEED.map((m) => movies.insert(m)));

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function ratingFilter(minRating) {
  return minRating !== undefined ? { rating: { $gte: minRating } } : {};
}

async function findAll({ minRating } = {}) {
  await ready;
  return movies.find(ratingFilter(minRating));
}

async function searchByField(field, q, { minRating } = {}) {
  await ready;
  const filter = { ...ratingFilter(minRating), [field]: { $regex: escapeRegex(q), $options: 'i' } };
  return movies.find(filter);
}

module.exports = { findAll, searchByField };
