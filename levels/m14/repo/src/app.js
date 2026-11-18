const express = require('express');
const svc = require('./polls');

const app = express();
app.use(express.json());
app.post('/polls/:id/vote', async (req, res) => {
  res.status(201).json(await svc.vote(req.params.id, req.get('x-user-id'), req.body.option));
});
app.get('/polls/:id/results', async (req, res) => res.json(await svc.results(req.params.id)));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

module.exports = app;
