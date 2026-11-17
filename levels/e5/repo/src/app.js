const express = require('express');
const cart = require('./cartService');
const { PRICES } = require('./catalog');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.userId = req.get('x-user-id') || 'guest';
  next();
});

app.post('/cart/items', async (req, res) => {
  const { sku, qty } = req.body;
  if (!PRICES[sku]) return res.status(404).json({ error: 'unknown sku' });
  if (!Number.isInteger(qty) || qty < 1) return res.status(400).json({ error: 'qty must be a positive integer' });
  res.status(201).json(await cart.addItem(req.userId, sku, qty));
});

app.get('/cart', async (req, res) => {
  res.json(await cart.view(req.userId));
});

app.post('/cart/coupon', async (req, res) => {
  const result = await cart.applyCoupon(req.userId, req.body.code);
  if (!result) return res.status(404).json({ error: 'unknown coupon' });
  res.json(result);
});

module.exports = app;
