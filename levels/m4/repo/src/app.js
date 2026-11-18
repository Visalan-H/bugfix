const express = require('express');
const loans = require('./routes/loans');
const errorHandler = require('./middleware/errorHandler');
const bookRepo = require('./repositories/bookRepo');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const id = req.get('x-member-id');
  if (!id) return res.status(401).json({ error: 'unauthenticated' });
  req.memberId = id;
  next();
});
app.get('/books/:id', async (req, res) => {
  const b = await bookRepo.findById(req.params.id);
  if (!b) return res.status(404).json({ error: 'book not found' });
  res.json(b);
});
app.use('/loans', loans);
app.use(errorHandler);

module.exports = app;
