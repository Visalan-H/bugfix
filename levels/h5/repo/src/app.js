const express = require('express');
const svc = require('./seats');

const app = express();
app.use(express.json());
app.post('/shows/:id/holds', async (req, res) => {
  res.status(201).json(await svc.hold(req.params.id, req.get('x-user-id'), req.body.seats));
});
app.post('/holds/:id/confirm', async (req, res) => res.json(await svc.confirm(req.params.id)));
app.get('/shows/:id/seats', async (req, res) => res.json(await svc.list(req.params.id)));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

module.exports = app;
