const db = require('memdb');
const reviews = db.collection('reviews');

class HttpError extends Error { constructor(status, m) { super(m); this.status = status; } }

async function add(productId, userId, rating) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, 'rating must be an integer 1-5');
  if (await reviews.findOne({ productId, userId, deleted: false })) throw new HttpError(409, 'already reviewed');
  return reviews.insert({ productId, userId, rating, deleted: false });
}

async function remove(id, userId) {
  const r = await reviews.findById(id);
  if (!r || r.deleted) throw new HttpError(404, 'not found');
  if (r.userId !== userId) throw new HttpError(403, 'not yours');
  await reviews.updateById(id, { deleted: true });
}

async function rating(productId) {
  const active = (await reviews.find({ productId })).filter((r) => !r.deleted);
  if (!active.length) return { avgRating: 0, reviewCount: 0 };
  const avg = active.reduce((s, r) => s + r.rating, 0) / active.length;
  return { avgRating: Math.round(avg * 10) / 10, reviewCount: active.length };
}

module.exports = { add, remove, rating };
