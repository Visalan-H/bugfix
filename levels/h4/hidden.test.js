const request = require('supertest');
const app = require('../src/app');
const clock = require('../src/lib/clock');

const hit = (key) => request(app).get('/api/quote').set('x-api-key', key);
const burst = async (key, n) => { const out = []; for (let i = 0; i < n; i++) out.push((await hit(key)).status); return out; };

describe('hidden', () => {
  test('missing key → 401', async () => {
    const res = await request(app).get('/api/quote');
    expect(res.status).toBe(401);
  });

  test('rejected requests do not extend the block', async () => {
    await burst('k', 5);
    clock.advance(30 * 1000);
    expect(await burst('k', 5)).toEqual([429, 429, 429, 429, 429]);
    clock.advance(31 * 1000);
    expect((await hit('k')).status).toBe(200);
  });

  test('Retry-After rounds up', async () => {
    await burst('k', 5);
    clock.advance(19500);
    const res = await hit('k');
    expect(res.headers['retry-after']).toBe('41');
  });

  test('sliding window: old hits roll off one by one', async () => {
    await hit('k');
    clock.advance(10 * 1000);
    await burst('k', 4);
    expect((await hit('k')).status).toBe(429);
    clock.advance(50 * 1000);
    expect((await hit('k')).status).toBe(200);
    expect((await hit('k')).status).toBe(429);
  });
});
