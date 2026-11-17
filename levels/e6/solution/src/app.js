const express = require('express');
const people = require('./people');

const app = express();

app.get('/users/search', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);

  const matches = people
    .filter((u) => !q || u.name.toLowerCase().startsWith(q))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit);

  res.json(matches);
});

module.exports = app;
