const request = require('supertest');
const app = require('../src/app');

const transfer = (user, body) => request(app).post('/transfers').set('x-user-id', user).send(body);
const balance = async (id) => (await request(app).get(`/accounts/${id}`)).body.balance;

describe('Transfers', () => {
  test('a normal transfer', async () => {
    const res = await transfer('u1', { from: 'acc-a', to: 'acc-b', amount: 200 });
    expect(res.status).toBe(201);
    expect(await balance('acc-a')).toBe(800);
    expect(await balance('acc-b')).toBe(700);
  });
  test('negative amount → 400', async () => {
    expect((await transfer('u1', { from: 'acc-a', to: 'acc-b', amount: -100 })).status).toBe(400);
    expect(await balance('acc-a')).toBe(1000);
  });
  test('cannot send from someone else\'s account', async () => {
    expect((await transfer('u1', { from: 'acc-b', to: 'acc-a', amount: 100 })).status).toBe(403);
    expect(await balance('acc-b')).toBe(500);
  });
  test('unknown receiver → 404 and nothing is debited', async () => {
    expect((await transfer('u1', { from: 'acc-a', to: 'acc-zzz', amount: 100 })).status).toBe(404);
    expect(await balance('acc-a')).toBe(1000);
  });
});
