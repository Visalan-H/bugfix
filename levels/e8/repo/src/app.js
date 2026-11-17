const express = require('express');
const svc = require('./rsvpService');

const app = express();
app.use(express.json());

app.get('/events/:id', async (req, res) => res.json(await svc.get(req.params.id)));
app.post('/events/:id/rsvp', async (req, res) => {
  await svc.join(req.params.id, req.get('x-user-id'));
  res.status(201).json(await svc.get(req.params.id));
});
app.delete('/events/:id/rsvp', async (req, res) => {
  await svc.leave(req.params.id, req.get('x-user-id'));
  res.status(204).end();
});
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

module.exports = app;
