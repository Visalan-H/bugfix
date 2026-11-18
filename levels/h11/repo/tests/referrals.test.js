const request = require('supertest');
const app = require('../src/app');

const signup = (email, referralCode) => request(app).post('/signup').send({ email, referralCode });
const ravi = async () => (await request(app).get('/referrers/RAVI100')).body;

describe('Referrals', () => {
  test('cap holds under concurrent signups', async () => {
    const rs = await Promise.all(['a', 'b', 'c', 'd'].map((n) => signup(`${n}@x.com`, 'RAVI100')));
    expect(rs.every((r) => r.status === 201)).toBe(true);
    expect(await ravi()).toEqual({ rewards: 3, balance: 300 });
  });
  test('duplicate signup → 409 and no reward', async () => {
    await signup('dup@x.com');
    expect((await signup('DUP@x.com', 'RAVI100')).status).toBe(409);
    expect((await ravi()).rewards).toBe(2);
  });
  test('code is case-insensitive', async () => {
    const res = await signup('new@x.com', ' ravi100 ');
    expect(res.body.referredBy).toBe('RAVI100');
    expect((await ravi()).rewards).toBe(3);
  });
});
