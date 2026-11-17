const request = require('supertest');
const app = require('../src/app');

const create = () => request(app).post('/orders').set('x-user-id', 'u1');
const move = (id, to, role = 'staff') => request(app).post(`/orders/${id}/transition`).set('x-role', role).send({ to });

describe('hidden', () => {
  test('unknown status → 400', async () => {
    const o = await create();
    expect((await move(o.body._id, 'teleported')).status).toBe(400);
  });
  test('customer can cancel a placed order', async () => {
    const o = await create();
    const res = await move(o.body._id, 'cancelled', 'customer');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });
  test('skipping a state → 409', async () => {
    const o = await create();
    expect((await move(o.body._id, 'delivered')).status).toBe(409);
  });
  test('unknown order → 404', async () => {
    expect((await move('nope', 'paid')).status).toBe(404);
  });
});
