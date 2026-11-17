const request = require('supertest');
const app = require('../src/app');
const clock = require('../src/clock');
const { issue, b64 } = require('../src/token');

const tok = (sub, role, ttlSec = 3600) => issue({ sub, role, exp: Math.floor(clock.now() / 1000) + ttlSec });
const get = (url, token) => { const r = request(app).get(url); if (token) r.set('Authorization', `Bearer ${token}`); return r; };

describe('Auth', () => {
  test('admin route needs a token', async () => {
    expect((await get('/admin/stats')).status).toBe(401);
  });
  test('a valid token works', async () => {
    const res = await get('/me', tok('u-dev', 'member'));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'u-dev', role: 'member' });
  });
  test('a tampered token is rejected', async () => {
    const real = tok('u-dev', 'member');
    const forged = b64(JSON.stringify({ sub: 'u-dev', role: 'admin', exp: 9999999999 })) + '.' + real.split('.')[1];
    expect((await get('/admin/stats', forged)).status).toBe(401);
  });
  test('admin can see stats', async () => {
    expect((await get('/admin/stats', tok('u-admin', 'admin'))).status).toBe(200);
  });
});
