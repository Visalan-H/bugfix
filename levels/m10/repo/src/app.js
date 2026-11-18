const express = require('express');
const svc = require('./projects');

const app = express();
app.use((req, res, next) => {
  const tenantId = req.get('x-tenant');
  if (!tenantId) return res.status(401).json({ error: 'no tenant' });
  req.ctx = { tenantId, userId: req.get('x-user-id'), role: req.get('x-role') || 'member' };
  next();
});
app.get('/projects', async (req, res) => res.json(await svc.list(req.ctx)));
app.get('/projects/search', async (req, res) => res.json(await svc.search(req.ctx, req.query.q)));
app.delete('/projects/:id', async (req, res) => {
  await svc.remove(req.ctx, req.params.id);
  res.status(204).end();
});
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

module.exports = app;
