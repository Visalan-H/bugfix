const express = require('express');
const svc = require('./referrals');

const app = express();
app.use(express.json());
app.post('/signup', async (req, res) => res.status(201).json(await svc.signup(req.body.email, req.body.referralCode)));
app.get('/referrers/:code', async (req, res) => res.json(await svc.referrer(req.params.code)));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

module.exports = app;
