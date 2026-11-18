const request = require('supertest');
const app = require('../src/app');
const clock = require('../src/clock');
const users = require('../src/users');
const { issue } = require('../src/token');

const tok = (sub, role, ttlSec = 3600) => issue({ sub, role, exp: Math.floor(clock.now() / 1000) + ttlSec });
const get = (url, token) => { const r = request(app).get(url); if (token) r.set('Authorization', `Bearer ${token}`); return r; };

describe('hidden', () => {
  test('expired token → 401', async () => {
    const t = tok('u-dev', 'member', 60);
    clock.advance(61 * 1000);
    expect((await get('/me', t)).status).toBe(401);
  });
  test('demoted admin loses access immediately', async () => {
    const t = tok('u-admin', 'admin');
    users.get('u-admin').role = 'member';
    expect((await get('/admin/stats', t)).status).toBe(403);
  });
  test('member token → 403 on admin route', async () => {
    expect((await get('/admin/stats', tok('u-dev', 'member'))).status).toBe(403);
  });
  test('health is public', async () => {
    expect((await get('/health')).status).toBe(200);
  });
  test('deleted user → 401', async () => {
    expect((await get('/me', tok('u-ghost', 'admin'))).status).toBe(401);
  });
});
