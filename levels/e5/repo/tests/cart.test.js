const request = require('supertest');
const app = require('../src/app');

const add = (sku, qty) => request(app).post('/cart/items').set('x-user-id', 'u1').send({ sku, qty });
const view = () => request(app).get('/cart').set('x-user-id', 'u1');

describe('Cart', () => {
  test('single item subtotal', async () => {
    await add('SKU-PEN', 3);
    const res = await view();
    expect(res.body.subtotal).toBe(60);
    expect(res.body.total).toBe(60);
  });

  test('two different products are two lines', async () => {
    await add('SKU-PEN', 2);
    await add('SKU-BOOK', 1);
    const res = await view();
    expect(res.body.items.map((i) => i.sku)).toEqual(['SKU-PEN', 'SKU-BOOK']);
    expect(res.body.subtotal).toBe(390);
  });

  test('SAVE10 takes 10% off', async () => {
    await add('SKU-PEN', 2);
    await add('SKU-BOOK', 1);
    const res = await request(app).post('/cart/coupon').set('x-user-id', 'u1').send({ code: 'SAVE10' });
    expect(res.body.discount).toBe(39);
    expect(res.body.total).toBe(351);
  });

  test('empty cart is all zeros', async () => {
    const res = await view();
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ subtotal: 0, discount: 0, total: 0 });
  });
});
