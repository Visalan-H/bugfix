const request = require('supertest');
const app = require('../src/app');

const fail = (id) => request(app).post(`/deliveries/${id}/fail`);

describe('Webhooks', () => {
  test('backoff 1s, 2s, 4s, then capped at 5s', async () => {
    const d = (await request(app).post('/deliveries')).body;
    const delays = [];
    for (let i = 0; i < 4; i++) delays.push((await fail(d._id)).body.nextRetryMs);
    expect(delays).toEqual([1000, 2000, 4000, 5000]);
  });
  test('dead after the 5th failure', async () => {
    const d = (await request(app).post('/deliveries')).body;
    let last;
    for (let i = 0; i < 5; i++) last = await fail(d._id);
    expect(last.body).toEqual({ attempts: 5, status: 'dead', nextRetryMs: null });
  });
});
