// In prod this verifies a JWT. For the exercise the gateway passes the user id in a header.
module.exports = function auth(req, res, next) {
  const userId = req.get('x-user-id');
  if (!userId) {
    return res.status(401).json({ error: 'unauthenticated' });
  }
  req.user = { id: userId };
  next();
};
