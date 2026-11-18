const express = require('express');
const board = require('./board');

const app = express();
app.use(express.json());

app.post('/scores', (req, res) => {
  const { player, score } = req.body;
  if (!player || typeof score !== 'number' || score < 0) return res.status(400).json({ error: 'bad score' });
  board.submit(player, score);
  res.status(201).json({ ok: true });
});

app.get('/leaderboard', (req, res) => {
  res.json(board.top(Number(req.query.top) || 10));
});

module.exports = app;
