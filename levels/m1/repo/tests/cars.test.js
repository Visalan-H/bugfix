const request = require('supertest');
const app = require('../src/app');

const as = (user) => ({
  get: (url) => request(app).get(url).set('x-user-id', user),
  post: (url, body) => request(app).post(url).set('x-user-id', user).send(body),
  patch: (url, body) => request(app).patch(url).set('x-user-id', user).send(body),
});
const alice = as('alice');
const bob = as('bob');

describe('My Garage', () => {
  test('GET /cars/mine only returns my cars', async () => {
    await alice.post('/cars', { model: 'Swift', dailyRate: 1800 });
    await bob.post('/cars', { model: 'Creta', dailyRate: 3200 });

    const res = await alice.get('/cars/mine');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].owner).toBe('alice');
  });

  test('a newly added car shows up in My Cars', async () => {
    const before = await alice.get('/cars/mine');
    expect(before.body).toHaveLength(0);

    await alice.post('/cars', { model: 'Nexon', dailyRate: 2500 });
    const after = await alice.get('/cars/mine');
    expect(after.body).toHaveLength(1);
    expect(after.body[0].model).toBe('Nexon');
  });

  test('an edit is persisted', async () => {
    const created = await alice.post('/cars', { model: 'i20', dailyRate: 2000 });
    const id = created.body._id;

    const patched = await alice.patch(`/cars/${id}`, { dailyRate: 2400 });
    expect(patched.status).toBe(200);
    expect(patched.body.dailyRate).toBe(2400);

    const fresh = await alice.get(`/cars/${id}`);
    expect(fresh.body.dailyRate).toBe(2400);
  });
});
