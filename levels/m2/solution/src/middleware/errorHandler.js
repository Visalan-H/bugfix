// Express error middleware: must take 4 args.
module.exports = function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Internal Server Error' : err.message });
};
