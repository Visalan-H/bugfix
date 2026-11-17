const all = require('./data');

// "DD/MM/YYYY HH:mm" (UTC) → epoch ms
function ts(s) {
  const [d, m, y, hh, mm] = s.split(/[/ :]/).map(Number);
  return Date.UTC(y, m - 1, d, hh, mm);
}

function forPost(postId) {
  return all
    .filter((c) => c.postId === postId)
    .sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
}

module.exports = { forPost };
