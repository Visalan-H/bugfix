const express = require('express');
const { quote } = require('./fees');

const app = express();
app.use(express.json());

app.post('/shipping/quote', (req, res) => {
  try {
    res.json({ fee: quote(req.body) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = app;
