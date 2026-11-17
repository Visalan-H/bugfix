const request = require('supertest');
const app = require('../src/app');

const transfer = (user, body) => request(app).post('/transfers').set('x-user-id', user).send(body);
const balance = async (id) => (await request(app).get(`/accounts/${id}`)).body.balance;

describe('hidden', () => {
  test('self-transfer → 400', async () => {
    expect((await transfer('u1', { from: 'acc-a', to: 'acc-a', amount: 10 })).status).toBe(400);
  });
  test('insufficient funds → 409, no change', async () => {
    expect((await transfer('u2', { from: 'acc-b', to: 'acc-a', amount: 501 })).status).toBe(409);
    expect(await balance('acc-a')).toBe(1000);
  });
  test('string amount → 400', async () => {
    expect((await transfer('u1', { from: 'acc-a', to: 'acc-b', amount: '100' })).status).toBe(400);
  });
  test('exact balance is allowed', async () => {
    expect((await transfer('u2', { from: 'acc-b', to: 'acc-a', amount: 500 })).status).toBe(201);
    expect(await balance('acc-b')).toBe(0);
  });
  test('unknown sender → 404', async () => {
    expect((await transfer('u1', { from: 'acc-x', to: 'acc-a', amount: 5 })).status).toBe(404);
  });
});
