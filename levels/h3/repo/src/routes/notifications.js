const express = require('express');
const service = require('../services/notificationService');

const router = express.Router();

router.get('/', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const cursor = req.query.cursor !== undefined ? Number(req.query.cursor) : undefined;
  res.json(await service.page(req.userId, { limit, cursor }));
});

router.get('/unread-count', async (req, res) => {
  res.json({ count: await service.unreadCount(req.userId) });
});

router.post('/read-all', async (req, res) => {
  res.json(await service.markAllRead(req.userId));
});

router.delete('/:id', async (req, res) => {
  await service.remove(req.userId, req.params.id);
  res.status(204).end();
});

module.exports = router;
