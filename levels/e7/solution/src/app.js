const express = require('express');
const repo = require('./linkRepo');
const { newCode } = require('./codes');

const app = express();
app.use(express.json());

app.post('/links', async (req, res) => {
  const { url } = req.body;
  if (!/^https?:\/\//.test(url || '')) return res.status(400).json({ error: 'invalid url' });
  const link = await repo.create({ code: newCode(), url, visits: 0 });
  res.status(201).json({ code: link.code, url: link.url });
});

app.get('/links/:code/stats', async (req, res) => {
  const link = await repo.findByCode(req.params.code);
  if (!link) return res.status(404).json({ error: 'not found' });
  res.json({ code: link.code, visits: link.visits });
});

app.get('/:code', async (req, res) => {
  const link = await repo.findByCode(req.params.code);
  if (!link) return res.status(404).json({ error: 'not found' });
  await repo.incrementVisits(link._id);
  res.redirect(302, link.url);
});

module.exports = app;
