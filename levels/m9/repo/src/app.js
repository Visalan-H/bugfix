const express = require('express');
const svc = require('./orders');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.userId = req.get('x-user-id');
  req.role = req.get('x-role') || 'staff';
  next();
});
app.post('/orders', async (req, res) => res.status(201).json(await svc.create(req.userId)));
app.post('/orders/:id/transition', async (req, res) => {
  res.json(await svc.transition(req.params.id, req.body.to, req.role));
});
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

module.exports = app;
