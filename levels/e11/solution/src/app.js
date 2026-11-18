const express = require('express');
const { forPost } = require('./comments');

const app = express();

app.get('/posts/:postId/comments', (req, res) => {
  const { authorId } = req.query;
  const list = forPost(req.params.postId);
  const comments = authorId ? list.filter((c) => c.authorId === authorId) : list;
  res.json({ total: comments.length, comments });
});

module.exports = app;
