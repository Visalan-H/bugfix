const movieRepo = require('../repositories/movieRepo');
const { byRatingThenTitle } = require('../utils/sort');

async function search({ q, field, minRating }) {
  let movies;
  if (!q) {
    movies = await movieRepo.findAll({ minRating });
  } else {
    movies = await movieRepo.searchByField(field, q, { minRating });
  }
  return movies.sort(byRatingThenTitle);
}

module.exports = { search };
