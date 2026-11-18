// Highest rating first; ties broken alphabetically by title.
const byRatingThenTitle = (a, b) => b.rating - a.rating || a.title.localeCompare(b.title);

module.exports = { byRatingThenTitle };
