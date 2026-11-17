const express = require('express');
const auth = require('./auth');

const app = express();

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/admin/stats', (req, res) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'admins only' });
  res.json({ users: 2 });
});

app.use(auth);

app.get('/me', (req, res) => res.json(req.user));

module.exports = app;
