const express = require('express');
const { forPost } = require('./comments');

const app = express();

app.get('/posts/:postId/comments', (req, res) => {
  const { author } = req.query;
  const list = forPost(req.params.postId);
  const total = list.length;
  const comments = author ? list.filter((c) => c.authorId === author) : list;
  res.json({ total, comments });
});

module.exports = app;
