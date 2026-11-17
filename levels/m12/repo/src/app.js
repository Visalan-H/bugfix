const express = require('express');
const db = require('memdb');
const { afterFailure } = require('./retry');
const { verify } = require('./signature');

const deliveries = db.collection('deliveries');
const app = express();
app.use(express.json());

app.post('/deliveries', async (req, res) => {
  res.status(201).json(await deliveries.insert({ attempts: 0, status: 'pending' }));
});

app.post('/deliveries/:id/fail', async (req, res) => {
  const d = await deliveries.findOneAndUpdate({ _id: req.params.id }, { $inc: { attempts: 1 } });
  if (!d) return res.status(404).json({ error: 'not found' });
  const next = afterFailure(d.attempts);
  await deliveries.updateById(d._id, { status: next.status });
  res.json({ attempts: d.attempts, ...next });
});

app.post('/verify', (req, res) => {
  res.json({ valid: verify(req.body.payload, req.body.signature) });
});

module.exports = app;
