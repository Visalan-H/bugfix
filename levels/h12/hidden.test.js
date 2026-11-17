const request = require('supertest');
const app = require('../src/app');

describe('hidden', () => {
  test('overall average is per session', async () => {
    const res = await request(app).get('/stats/daily?from=2026-03-08&to=2026-03-09');
    expect(res.body.overallAvgSec).toBe(40);
  });
  test('range with no sessions', async () => {
    const res = await request(app).get('/stats/daily?from=2026-04-01&to=2026-04-02');
    expect(res.body).toEqual({ days: [{ day: '2026-04-01', sessions: 0, avgSec: 0 }, { day: '2026-04-02', sessions: 0, avgSec: 0 }], overallAvgSec: 0 });
  });
  test('whole range', async () => {
    const res = await request(app).get('/stats/daily?from=2026-03-01&to=2026-03-31');
    expect(res.body.days).toHaveLength(31);
    expect(res.body.overallAvgSec).toBe(47);
  });
});
