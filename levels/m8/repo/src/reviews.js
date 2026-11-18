const db = require('memdb');
const reviews = db.collection('reviews');

class HttpError extends Error { constructor(status, m) { super(m); this.status = status; } }

async function add(productId, userId, rating) {
  if (typeof rating !== 'number' || rating < 1 || rating > 5) throw new HttpError(400, 'rating must be 1-5');
  return reviews.insert({ productId, userId, rating, deleted: false });
}

async function remove(id, userId) {
  const r = await reviews.findById(id);
  if (!r || r.deleted) throw new HttpError(404, 'not found');
  if (r.userId !== userId) throw new HttpError(403, 'not yours');
  await reviews.updateById(id, { deleted: true });
}

async function rating(productId) {
  const all = await reviews.find({ productId });
  const sum = all.filter((r) => !r.deleted).reduce((s, r) => s + r.rating, 0);
  const avg = sum / all.length;
  return { avgRating: avg.toFixed(1), reviewCount: all.filter((r) => !r.deleted).length };
}

module.exports = { add, remove, rating };
