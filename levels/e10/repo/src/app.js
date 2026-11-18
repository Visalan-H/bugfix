const express = require('express');
const { isEnabled } = require('./flags');

const app = express();
app.get('/flags/:name', (req, res) => {
  res.json({ flag: req.params.name, enabled: isEnabled(req.params.name, req.query.userId || '') });
});

module.exports = app;
