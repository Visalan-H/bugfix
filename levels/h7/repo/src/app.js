const express = require('express');
const q = require('./queue');

const app = express();
app.use(express.json());
app.post('/jobs', async (req, res) => res.status(201).json(await q.enqueue(req.body.type)));
app.post('/workers/:w/claim', async (req, res) => {
  const job = await q.claim(req.params.w);
  if (!job) return res.status(204).end();
  res.json(job);
});
app.post('/workers/:w/jobs/:id/complete', async (req, res) => {
  const job = await q.complete(req.params.w, req.params.id);
  if (!job) return res.status(409).json({ error: 'not your running job' });
  res.json(job);
});

module.exports = app;
