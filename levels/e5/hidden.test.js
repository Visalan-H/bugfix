const request = require('supertest');
const app = require('../src/app');

const add = (sku, qty) => request(app).post('/cart/items').set('x-user-id', 'u1').send({ sku, qty });

describe('hidden', () => {
  test('same SKU twice merges into one line', async () => {
    await add('SKU-PEN', 2);
    const res = await add('SKU-PEN', 3);
    expect(res.body.items).toEqual([{ sku: 'SKU-PEN', qty: 5, price: 20 }]);
  });

  test('coupon is case-insensitive', async () => {
    await add('SKU-BAG', 1);
    const res = await request(app).post('/cart/coupon').set('x-user-id', 'u1').send({ code: ' save10 ' });
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1080);
  });

  test('unknown coupon → 404', async () => {
    const res = await request(app).post('/cart/coupon').set('x-user-id', 'u1').send({ code: 'FREE' });
    expect(res.status).toBe(404);
  });

  test('qty 0 → 400, unknown sku → 404', async () => {
    expect((await add('SKU-PEN', 0)).status).toBe(400);
    expect((await add('SKU-NOPE', 1)).status).toBe(404);
  });

  test('carts are per user', async () => {
    await add('SKU-PEN', 1);
    const res = await request(app).get('/cart').set('x-user-id', 'u2');
    expect(res.body.items).toEqual([]);
  });
});
