const express = require('express');
const service = require('../services/resetService');

const router = express.Router();

router.post('/forgot', async (req, res) => {
  await service.requestReset(req.body.email);
  res.status(202).json({ ok: true });
});

router.post('/reset', async (req, res) => {
  await service.resetPassword(req.body.token, req.body.newPassword);
  res.json({ ok: true });
});

router.post('/login', async (req, res) => {
  await service.login(req.body.email, req.body.password);
  res.json({ ok: true });
});

module.exports = router;
