const request = require('supertest');
const app = require('../src/app');

const order = (items, key) => {
  const r = request(app).post('/orders').set('x-user-id', 'u1');
  if (key) r.set('Idempotency-Key', key);
  return r.send({ items });
};
const stock = async (id) => (await request(app).get(`/products/${id}`).set('x-user-id', 'u1')).body.stock;

describe('hidden', () => {
  test('orders without a key are always new orders', async () => {
    const a = await order([{ productId: 'p-echo', qty: 1 }]);
    const b = await order([{ productId: 'p-echo', qty: 1 }]);
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(a.body._id).not.toBe(b.body._id);
    expect(await stock('p-echo')).toBe(3);
  });

  test('different keys are different orders', async () => {
    const a = await order([{ productId: 'p-echo', qty: 1 }], 'k1');
    const b = await order([{ productId: 'p-echo', qty: 1 }], 'k2');
    expect(a.body._id).not.toBe(b.body._id);
  });

  test('bad qty on the 2nd line → 400 and no stock change', async () => {
    const res = await order([{ productId: 'p-echo', qty: 1 }, { productId: 'p-cable', qty: 0 }]);
    expect(res.status).toBe(400);
    expect(await stock('p-echo')).toBe(5);
  });

  test('unknown product on the 2nd line → 404 and no stock change', async () => {
    const res = await order([{ productId: 'p-echo', qty: 2 }, { productId: 'nope', qty: 1 }]);
    expect(res.status).toBe(404);
    expect(await stock('p-echo')).toBe(5);
  });

  test('3 concurrent orders of 2 Echo Dots with stock 5 → exactly 2 succeed', async () => {
    const rs = await Promise.all([1, 2, 3].map(() => order([{ productId: 'p-echo', qty: 2 }])));
    expect(rs.filter((r) => r.status === 201)).toHaveLength(2);
    expect(await stock('p-echo')).toBe(1);
  });

  test('empty items → 400', async () => {
    const res = await order([]);
    expect(res.status).toBe(400);
  });
});
