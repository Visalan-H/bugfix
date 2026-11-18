const express = require('express');
const service = require('../services/userService');
const requireUser = require('../middleware/requireUser');

const router = express.Router();

router.post('/', async (req, res) => {
  const user = await service.signup(req.body);
  res.status(201).json(user);
});

router.get('/me', requireUser, async (req, res) => {
  res.json(await service.getProfile(req.userId));
});

router.patch('/me', requireUser, async (req, res) => {
  res.json(await service.updateProfile(req.userId, req.body));
});

module.exports = router;
