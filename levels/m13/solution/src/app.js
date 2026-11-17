const express = require('express');
const db = require('memdb');
const cache = require('./cache');

const products = db.collection('products');
const ready = Promise.all([
  products.insert({ name: 'Mug', price: 100 }),
  products.insert({ name: 'Lamp', price: 500 }),
  products.insert({ name: 'Mat', price: 250 }),
]);

const app = express();
app.use(express.json());

app.get('/products', cache.middleware, async (req, res) => {
  let data = req.cached;
  if (!data) {
    await ready;
    const page = Number(req.query.page) || 1;
    const all = await products.find({});
    data = { page, items: all.slice((page - 1) * 2, page * 2) };
    cache.put(req.cacheKey, data);
  }
  res.json({
    page: data.page,
    items: data.items.map((i) => ({ ...i, priceWithGst: Math.round(i.price * 1.18) })),
  });
});

app.post('/products', async (req, res) => {
  await ready;
  const p = await products.insert({ name: req.body.name, price: req.body.price });
  cache.clear();
  res.status(201).json(p);
});

app.get('/cache/stats', (req, res) => res.json(cache.stats));

module.exports = app;
