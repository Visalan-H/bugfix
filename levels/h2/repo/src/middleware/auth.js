module.exports = function auth(req, res, next) {
  const id = req.get('x-user-id');
  if (!id) return res.status(401).json({ error: 'unauthenticated' });
  req.user = { id };
  next();
};
