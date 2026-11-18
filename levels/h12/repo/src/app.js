const express = require('express');
const { daily } = require('./rollup');

const app = express();
app.get('/stats/daily', (req, res) => res.json(daily(req.query.from, req.query.to)));

module.exports = app;
