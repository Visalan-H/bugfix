const request = require('supertest');
const app = require('../src/app');

const u = 'u1';
const add = (movieId) => request(app).post('/watchlist').set('x-user-id', u).send({ movieId });
const list = () => request(app).get('/watchlist').set('x-user-id', u);
const del = (movieId) => request(app).delete(`/watchlist/${movieId}`).set('x-user-id', u);

describe('Watch list', () => {
  test('add a movie', async () => {
    const res = await add('m1');
    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].title).toBe('Inception');
  });

  test('adding the same movie twice → 409', async () => {
    await add('m2');
    const res = await add('m2');
    expect(res.status).toBe(409);
    expect((await list()).body.items).toHaveLength(1);
  });

  test('unknown movie → 404 and nothing is added', async () => {
    const res = await add('m999');
    expect(res.status).toBe(404);
    expect((await list()).body.items).toHaveLength(0);
  });

  test('removed movie stays removed', async () => {
    await add('m1');
    await add('m3');
    const res = await del('m1');
    expect(res.status).toBe(204);
    const after = await list();
    expect(after.body.items.map((i) => i.movieId)).toEqual(['m3']);
  });
});
