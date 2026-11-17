const express = require('express');
const { validateProfile } = require('./validate');

const app = express();
app.use(express.json());

app.post('/profiles', (req, res) => {
  const errors = validateProfile(req.body);
  if (errors.length) return res.status(400).json({ errors });
  res.status(201).json({ ok: true, profile: req.body });
});

module.exports = app;
