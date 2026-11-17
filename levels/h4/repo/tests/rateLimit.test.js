const request = require('supertest');
const app = require('../src/app');
const clock = require('../src/lib/clock');

const hit = (key) => request(app).get('/api/quote').set('x-api-key', key);
const burst = async (key, n) => { const out = []; for (let i = 0; i < n; i++) out.push((await hit(key)).status); return out; };

describe('Rate limiter', () => {
  test('5 requests pass, the 6th is 429', async () => {
    expect(await burst('k1', 6)).toEqual([200, 200, 200, 200, 200, 429]);
  });

  test('limits are per API key', async () => {
    await burst('k1', 6);
    const other = await hit('k2');
    expect(other.status).toBe(200);
  });

  test('allowed again after the window passes', async () => {
    await burst('k1', 5);
    clock.advance(60 * 1000);
    expect((await hit('k1')).status).toBe(200);
  });

  test('Retry-After is in seconds', async () => {
    await burst('k1', 5);
    clock.advance(20 * 1000);
    const res = await hit('k1');
    expect(res.status).toBe(429);
    expect(res.headers['retry-after']).toBe('40');
  });
});
