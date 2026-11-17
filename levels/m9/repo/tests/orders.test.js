const request = require('supertest');
const app = require('../src/app');

const create = () => request(app).post('/orders').set('x-user-id', 'u1');
const move = (id, to, role) => {
  const r = request(app).post(`/orders/${id}/transition`).set('x-user-id', 'u1');
  if (role) r.set('x-role', role);
  return r.send({ to });
};

describe('Order transitions', () => {
  test('staff: placed → paid → shipped', async () => {
    const o = await create();
    const paid = await move(o.body._id, 'paid', 'staff');
    expect(paid.status).toBe(200);
    expect(paid.body.status).toBe('paid');
    const shipped = await move(o.body._id, 'shipped', 'staff');
    expect(shipped.body.history).toEqual(['placed', 'paid', 'shipped']);
  });
  test('no role header = customer, cannot ship', async () => {
    const o = await create();
    await move(o.body._id, 'paid', 'staff');
    expect((await move(o.body._id, 'shipped')).status).toBe(403);
  });
  test('cannot cancel after shipping', async () => {
    const o = await create();
    await move(o.body._id, 'paid', 'staff');
    await move(o.body._id, 'shipped', 'staff');
    expect((await move(o.body._id, 'cancelled', 'customer')).status).toBe(409);
  });
});
