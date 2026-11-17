const movieRepo = require('../repositories/movieRepo');
const { byRatingThenTitle } = require('../utils/sort');

async function search({ q, field, minRating }) {
  const term = (q || '').trim();
  let movies;
  if (!term) {
    movies = await movieRepo.findAll({ minRating });
  } else {
    movies = await movieRepo.searchByField(field, term, { minRating });
  }
  return movies.sort(byRatingThenTitle);
}

module.exports = { search };
