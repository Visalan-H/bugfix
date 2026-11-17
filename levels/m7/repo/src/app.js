const express = require('express');
const { checkout } = require('./coupons');

const app = express();
app.use(express.json());
app.post('/checkout', async (req, res) => {
  res.json(await checkout(req.get('x-user-id'), req.body.code, req.body.orderTotal));
});
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

module.exports = app;
