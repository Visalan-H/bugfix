const express = require('express');
const catalog = require('../services/catalogService');

const router = express.Router();

router.get('/', (req, res) => {
  const { page, limit, sort, category } = req.query;
  res.json(catalog.listProducts({ page, limit, sort, category }));
});

module.exports = router;
