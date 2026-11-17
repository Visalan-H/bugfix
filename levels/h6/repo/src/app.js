const express = require('express');
const w = require('./wallet');

const app = express();
app.use(express.json());
app.post('/wallets/:id/topup', async (req, res) => {
  const { entry, replay } = await w.topUp(req.params.id, req.body.amount, req.get('idempotency-key'));
  res.status(replay ? 200 : 201).json(entry);
});
app.post('/wallets/:id/pay', async (req, res) => res.status(201).json(await w.pay(req.params.id, req.body.amount)));
app.post('/payments/:id/refund', async (req, res) => res.status(201).json(await w.refund(req.params.id, req.body.amount)));
app.get('/wallets/:id', async (req, res) => res.json({ balance: await w.balance(req.params.id) }));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

module.exports = app;
