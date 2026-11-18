const request = require('supertest');
const app = require('../src/app');

const stats = (from, to) => request(app).get(`/stats/daily?from=${from}&to=${to}`);

describe('Daily rollup', () => {
  test('padded keys, in order', async () => {
    const res = await stats('2026-03-08', '2026-03-12');
    expect(res.body.days.map((d) => d.day)).toEqual(['2026-03-08', '2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12']);
  });
  test('empty days are filled with zeros', async () => {
    const res = await stats('2026-03-09', '2026-03-11');
    expect(res.body.days).toEqual([
      { day: '2026-03-09', sessions: 3, avgSec: 20 },
      { day: '2026-03-10', sessions: 0, avgSec: 0 },
      { day: '2026-03-11', sessions: 1, avgSec: 50 },
    ]);
  });
  test('the to-day is included', async () => {
    const res = await stats('2026-03-12', '2026-03-12');
    expect(res.body.days).toEqual([{ day: '2026-03-12', sessions: 1, avgSec: 70 }]);
  });
});
