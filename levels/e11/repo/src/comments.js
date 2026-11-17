const all = require('./data');

function forPost(postId) {
  return all
    .filter((c) => c.postId === postId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

module.exports = { forPost };
