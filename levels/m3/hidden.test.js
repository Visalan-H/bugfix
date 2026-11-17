const request = require('supertest');
const app = require('../src/app');

const as = (u) => ({
  add: (movieId) => request(app).post('/watchlist').set('x-user-id', u).send({ movieId }),
  list: () => request(app).get('/watchlist').set('x-user-id', u),
  del: (movieId) => request(app).delete(`/watchlist/${movieId}`).set('x-user-id', u),
});

describe('hidden', () => {
  test('removing a movie not in the list → 404', async () => {
    const a = as('a');
    await a.add('m1');
    const res = await a.del('m4');
    expect(res.status).toBe(404);
  });

  test('lists are per user', async () => {
    await as('a').add('m1');
    const res = await as('b').list();
    expect(res.body.items).toHaveLength(0);
  });

  test('can re-add after removing', async () => {
    const a = as('a');
    await a.add('m2');
    await a.del('m2');
    const res = await a.add('m2');
    expect(res.status).toBe(201);
  });

  test('a 409 does not change the list', async () => {
    const a = as('a');
    await a.add('m1');
    await a.add('m2');
    await a.add('m1');
    const res = await a.list();
    expect(res.body.items.map((i) => i.movieId)).toEqual(['m1', 'm2']);
  });

  test('missing x-user-id → 401', async () => {
    const res = await request(app).get('/watchlist');
    expect(res.status).toBe(401);
  });
});
