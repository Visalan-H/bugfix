const request = require('supertest');
const app = require('../src/app');

const review = (user, rating, p = 'p1') => request(app).post(`/products/${p}/reviews`).set('x-user-id', user).send({ rating });
const rating = (p = 'p1') => request(app).get(`/products/${p}/rating`);

describe('Reviews', () => {
  test('average is a 1-decimal number', async () => {
    await review('a', 5); await review('b', 4); await review('c', 4);
    expect((await rating()).body).toEqual({ avgRating: 4.3, reviewCount: 3 });
  });
  test('one review per user per product', async () => {
    await review('a', 5);
    expect((await review('a', 1)).status).toBe(409);
  });
  test('deleted reviews don\'t count', async () => {
    await review('a', 5); await review('b', 4);
    const r = await review('c', 3);
    await request(app).delete(`/reviews/${r.body._id}`).set('x-user-id', 'c');
    expect((await rating()).body).toEqual({ avgRating: 4.5, reviewCount: 2 });
  });
});
