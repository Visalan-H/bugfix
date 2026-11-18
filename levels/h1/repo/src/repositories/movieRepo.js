const db = require('memdb');
const SEED = require('../data/movies');

const movies = db.collection('movies');
const ready = Promise.all(SEED.map((m) => movies.insert(m)));

function ratingFilter(minRating) {
  return minRating ? { rating: { $gt: minRating } } : {};
}

async function findAll({ minRating } = {}) {
  await ready;
  return movies.find(ratingFilter(minRating));
}

async function searchByField(field, q, { minRating } = {}) {
  await ready;
  const filter = { ...ratingFilter(minRating), [field]: { $regex: q } };
  return movies.find(filter);
}

module.exports = { findAll, searchByField };
