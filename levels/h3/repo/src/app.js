const express = require('express');
const routes = require('./routes/notifications');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const id = req.get('x-user-id');
  if (!id) return res.status(401).json({ error: 'unauthenticated' });
  req.userId = id;
  next();
});
app.use('/notifications', routes);
app.use(errorHandler);

module.exports = app;
