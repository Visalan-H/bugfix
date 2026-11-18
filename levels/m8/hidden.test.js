const request = require('supertest');
const app = require('../src/app');

const review = (user, rating, p = 'p1') => request(app).post(`/products/${p}/reviews`).set('x-user-id', user).send({ rating });

describe('hidden', () => {
  test('3.5 → 400', async () => { expect((await review('a', 3.5)).status).toBe(400); });
  test('no reviews → 0', async () => {
    expect((await request(app).get('/products/p9/rating')).body).toEqual({ avgRating: 0, reviewCount: 0 });
  });
  test('can review again after deleting', async () => {
    const r = await review('a', 2);
    await request(app).delete(`/reviews/${r.body._id}`).set('x-user-id', 'a');
    expect((await review('a', 5)).status).toBe(201);
  });
  test('same user, different products is fine', async () => {
    await review('a', 5, 'p1');
    expect((await review('a', 5, 'p2')).status).toBe(201);
  });
  test('cannot delete someone else\'s review', async () => {
    const r = await review('a', 5);
    expect((await request(app).delete(`/reviews/${r.body._id}`).set('x-user-id', 'b')).status).toBe(403);
  });
});
