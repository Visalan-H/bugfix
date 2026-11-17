const request = require('supertest');
const app = require('../src/app');

const as = (user) => ({
  get: (url) => request(app).get(url).set('x-user-id', user),
  post: (url, body) => request(app).post(url).set('x-user-id', user).send(body),
  patch: (url, body) => request(app).patch(url).set('x-user-id', user).send(body),
});
const alice = as('alice');
const bob = as('bob');

describe('hidden', () => {
  test('cannot read another user\'s car by id', async () => {
    const c = await bob.post('/cars', { model: 'Thar', dailyRate: 4000 });
    const res = await alice.get(`/cars/${c.body._id}`);
    expect(res.status).toBe(404);
  });

  test('cannot edit another user\'s car', async () => {
    const c = await bob.post('/cars', { model: 'Thar', dailyRate: 4000 });
    const res = await alice.patch(`/cars/${c.body._id}`, { dailyRate: 1 });
    expect(res.status).toBe(404);
    const still = await bob.get(`/cars/${c.body._id}`);
    expect(still.body.dailyRate).toBe(4000);
  });

  test('edit shows up in My Cars (cache invalidated on update)', async () => {
    const c = await alice.post('/cars', { model: 'City', dailyRate: 2200 });
    await alice.get('/cars/mine');
    await alice.patch(`/cars/${c.body._id}`, { dailyRate: 2600 });
    const list = await alice.get('/cars/mine');
    expect(list.body[0].dailyRate).toBe(2600);
  });

  test('owner cannot be changed through PATCH', async () => {
    const c = await alice.post('/cars', { model: 'City', dailyRate: 2200 });
    await alice.patch(`/cars/${c.body._id}`, { owner: 'bob' });
    const res = await alice.get(`/cars/${c.body._id}`);
    expect(res.body.owner).toBe('alice');
  });

  test('missing x-user-id is 401', async () => {
    const res = await request(app).get('/cars/mine');
    expect(res.status).toBe(401);
  });
});
