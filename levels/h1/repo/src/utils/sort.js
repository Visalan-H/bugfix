// Highest rating first; ties broken alphabetically by title.
const byRatingThenTitle = (a, b) => b.rating - a.rating || a.title > b.title ? 1 : -1;

module.exports = { byRatingThenTitle };
