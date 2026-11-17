const request = require('supertest');
const app = require('../src/app');

const order = (items, key) => {
  const r = request(app).post('/orders').set('x-user-id', 'u1');
  if (key) r.set('Idempotency-Key', key);
  return r.send({ items });
};
const stock = async (id) => (await request(app).get(`/products/${id}`).set('x-user-id', 'u1')).body.stock;

describe('Checkout', () => {
  test('total is rounded to 2 decimals and stock goes down', async () => {
    const res = await order([{ productId: 'p-echo', qty: 1 }, { productId: 'p-cable', qty: 2 }]);
    expect(res.status).toBe(201);
    expect(res.body.total).toBe(69.97);
    expect(await stock('p-echo')).toBe(4);
    expect(await stock('p-cable')).toBe(0);
  });

  test('a failed order does not change any stock', async () => {
    const res = await order([{ productId: 'p-echo', qty: 1 }, { productId: 'p-cable', qty: 5 }]);
    expect(res.status).toBe(409);
    expect(await stock('p-echo')).toBe(5);
    expect(await stock('p-cable')).toBe(2);
  });

  test('two concurrent buyers cannot both get the last Kindle', async () => {
    const [a, b] = await Promise.all([
      order([{ productId: 'p-kindle', qty: 1 }]),
      order([{ productId: 'p-kindle', qty: 1 }]),
    ]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect(await stock('p-kindle')).toBe(0);
  });

  test('retry with the same Idempotency-Key returns the same order once', async () => {
    const first = await order([{ productId: 'p-echo', qty: 2 }], 'key-123');
    const retry = await order([{ productId: 'p-echo', qty: 2 }], 'key-123');
    expect(first.status).toBe(201);
    expect(retry.status).toBe(200);
    expect(retry.body._id).toBe(first.body._id);
    expect(await stock('p-echo')).toBe(3);
  });
});
