module.exports = function auth(req, res, next) {
  if (!req.get('x-api-key')) {
    return res.status(401).json({ error: 'missing api key' });
  }
  next();
};
