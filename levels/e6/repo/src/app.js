const express = require('express');
const people = require('./people');

const app = express();

app.get('/users/search', (req, res) => {
  const q = req.query.q.toLowerCase();
  const limit = parseInt(req.query.limit, 10) || 5;
  if (limit > 20) limit = 20;

  const matches = people
    .filter((u) => !q || u.name.toLowerCase().includes(q))
    .sort((a, b) => a.name - b.name)
    .slice(0, limit);

  res.json(matches);
});

module.exports = app;
