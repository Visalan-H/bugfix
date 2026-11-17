const express = require('express');
const { lowStock } = require('./report');

const app = express();
app.get('/reports/low-stock', (req, res) => res.json(lowStock(req.query.threshold)));

module.exports = app;
