const request = require('supertest');
const app = require('../src/app');

const signup = (email, referralCode) => request(app).post('/signup').send({ email, referralCode });

describe('hidden', () => {
  test('unknown code is ignored', async () => {
    const res = await signup('z@x.com', 'NOPE');
    expect(res.status).toBe(201);
    expect(res.body.referredBy).toBe(null);
  });
  test('after the cap, signups still work and are still attributed', async () => {
    await signup('a@x.com', 'RAVI100');
    const res = await signup('b@x.com', 'RAVI100');
    expect(res.status).toBe(201);
    expect(res.body.referredBy).toBe('RAVI100');
    expect((await request(app).get('/referrers/RAVI100')).body.rewards).toBe(3);
  });
  test('bad email → 400 and no reward', async () => {
    expect((await signup('nope', 'RAVI100')).status).toBe(400);
    expect((await request(app).get('/referrers/RAVI100')).body.rewards).toBe(2);
  });
});
