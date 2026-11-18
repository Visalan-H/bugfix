const express = require('express');
const booking = require('./booking');

const app = express();
app.use(express.json());

app.post('/appointments', async (req, res) => {
  res.status(201).json(await booking.book(req.body));
});
app.post('/appointments/:id/cancel', async (req, res) => {
  res.json(await booking.cancel(req.params.id));
});
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

module.exports = app;
