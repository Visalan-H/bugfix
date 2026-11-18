const searchService = require('../services/searchService');

const ALLOWED_FIELDS = ['title', 'director', 'genre'];

exports.search = async (req, res) => {
  const field = req.query.field || 'title';
  if (!ALLOWED_FIELDS.includes(field)) {
    return res.status(400).json({ error: `field must be one of ${ALLOWED_FIELDS.join(', ')}` });
  }

  let minRating;
  if (req.query.minRating !== undefined) {
    minRating = Number(req.query.minRating);
    if (Number.isNaN(minRating) || minRating < 0 || minRating > 10) {
      return res.status(400).json({ error: 'minRating must be between 0 and 10' });
    }
  }

  const results = await searchService.search({ q: req.query.q, field, minRating });
  res.json({ count: results.length, results });
};
