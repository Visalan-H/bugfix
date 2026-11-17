const request = require('supertest');
const app = require('../src/app');

const pay = (user, code, orderTotal) => request(app).post('/checkout').set('x-user-id', user).send({ code, orderTotal });

describe('Coupons', () => {
  test('WELCOME50 on exactly ₹300', async () => {
    const res = await pay('u1', 'WELCOME50', 300);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(250);
  });
  test('BIG20 is capped at ₹200', async () => {
    expect((await pay('u1', 'BIG20', 2000)).body).toEqual({ discount: 200, total: 1800 });
  });
  test('WELCOME50 is once per user, not once globally', async () => {
    expect((await pay('u1', 'WELCOME50', 500)).status).toBe(200);
    expect((await pay('u1', 'WELCOME50', 500)).status).toBe(400);
    expect((await pay('u2', 'WELCOME50', 500)).status).toBe(200);
  });
});
