const express = require('express');
const ctrl = require('./controllers/watchlistController');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const id = req.get('x-user-id');
  if (!id) return res.status(401).json({ error: 'unauthenticated' });
  req.userId = id;
  next();
});
app.get('/watchlist', ctrl.get);
app.post('/watchlist', ctrl.add);
app.delete('/watchlist/:movieId', ctrl.remove);
app.use(errorHandler);

module.exports = app;
