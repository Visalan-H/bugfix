const express = require('express');
const repo = require('../repositories/todoRepo');

const router = express.Router();

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.done !== undefined) {
    filter.done = req.query.done === 'true';
  }
  const items = await repo.list(filter);
  res.json(items);
});

router.post('/', async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const todo = await repo.create({ title: title.trim() });
  res.status(201).json(todo);
});

router.patch('/:id/toggle', async (req, res) => {
  const todo = await repo.findById(req.params.id);
  if (!todo) return res.status(404).json({ error: 'todo not found' });
  const updated = await repo.update(todo._id, { done: !todo.done });
  res.json(updated);
});

module.exports = router;
