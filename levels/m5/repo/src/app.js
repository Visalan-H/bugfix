const express = require('express');
const svc = require('./transferService');

const app = express();
app.use(express.json());

app.get('/accounts/:id', async (req, res) => res.json(await svc.getAccount(req.params.id)));
app.post('/transfers', async (req, res) => {
  const { from, to, amount } = req.body;
  res.status(201).json(await svc.transfer(req.get('x-user-id'), from, to, amount));
});
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

module.exports = app;
