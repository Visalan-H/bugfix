const express = require('express');
const svc = require('./reviews');

const app = express();
app.use(express.json());
app.post('/products/:id/reviews', async (req, res) => {
  res.status(201).json(await svc.add(req.params.id, req.get('x-user-id'), req.body.rating));
});
app.delete('/reviews/:id', async (req, res) => {
  await svc.remove(req.params.id, req.get('x-user-id'));
  res.status(204).end();
});
app.get('/products/:id/rating', async (req, res) => res.json(await svc.rating(req.params.id)));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

module.exports = app;
