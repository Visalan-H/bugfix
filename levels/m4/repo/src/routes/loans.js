const express = require('express');
const service = require('../services/loanService');

const router = express.Router();

router.post('/', async (req, res) => {
  const loan = await service.borrow(req.memberId, req.body.bookId);
  res.status(201).json(loan);
});

router.post('/:id/return', async (req, res) => {
  const loan = await service.returnLoan(req.memberId, req.params.id);
  res.json(loan);
});

module.exports = router;
