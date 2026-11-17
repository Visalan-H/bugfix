const express = require('express');
const { search } = require('./search');

const app = express();
app.get('/items', async (req, res) => res.json(await search(req.query)));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

module.exports = app;
