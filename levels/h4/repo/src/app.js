const express = require('express');
const auth = require('./middleware/auth');
const rateLimit = require('./middleware/rateLimit');

const app = express();
app.use(express.json());
app.use(auth);

app.get('/api/quote', rateLimit({ limit: 5, windowMs: 60 * 1000 }), (req, res) => {
  res.json({ quote: 'Ship small, ship often.', client: req.get('x-api-key') });
});

module.exports = app;
