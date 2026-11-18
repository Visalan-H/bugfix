const express = require('express');
const s = require('./storage');

const app = express();
app.use(express.json());
app.put('/files/:name', async (req, res) => {
  await s.put(req.get('x-user-id'), req.params.name, req.body.sizeKb);
  res.status(201).json(await s.report(req.get('x-user-id')));
});
app.delete('/files/:name', async (req, res) => {
  await s.remove(req.get('x-user-id'), req.params.name);
  res.status(204).end();
});
app.get('/usage', async (req, res) => res.json(await s.report(req.get('x-user-id'))));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

module.exports = app;
