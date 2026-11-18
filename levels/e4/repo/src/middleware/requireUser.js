const { AuthError } = require('../errors');

module.exports = function requireUser(req, res, next) {
  const id = req.get('x-user-id');
  if (!id) throw new AuthError();
  req.userId = id;
  next();
};
