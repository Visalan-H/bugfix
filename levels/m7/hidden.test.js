const request = require('supertest');
const app = require('../src/app');
const clock = require('../src/clock');

const pay = (user, code, orderTotal) => request(app).post('/checkout').set('x-user-id', user).send({ code, orderTotal });

describe('hidden', () => {
  test('valid on the afternoon of its last day', async () => {
    clock.set(Date.UTC(2026, 11, 31, 15, 0, 0));
    expect((await pay('u1', 'BIG20', 1000)).status).toBe(200);
  });
  test('expired the next day', async () => {
    clock.set(Date.UTC(2027, 0, 1, 0, 0, 1));
    expect((await pay('u1', 'BIG20', 1000)).status).toBe(400);
  });
  test('expired coupon → 400', async () => {
    expect((await pay('u1', 'SUMMER20', 1000)).status).toBe(400);
  });
  test('BIG20 under the cap', async () => {
    expect((await pay('u1', 'BIG20', 500)).body).toEqual({ discount: 100, total: 400 });
  });
  test('₹299 → 400', async () => {
    expect((await pay('u1', 'WELCOME50', 299)).status).toBe(400);
  });
  test('rejected checkout does not use up the coupon', async () => {
    await pay('u3', 'WELCOME50', 100);
    expect((await pay('u3', 'WELCOME50', 400)).status).toBe(200);
  });
});
