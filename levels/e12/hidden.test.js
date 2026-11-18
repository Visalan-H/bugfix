const request = require('supertest');
const app = require('../src/app');

describe('hidden', () => {
  test('threshold=100 includes everything', async () => {
    const res = await request(app).get('/reports/low-stock?threshold=100');
    expect(res.body.items).toHaveLength(6);
    expect(res.body.totalUnits).toBe(134);
  });
  test('threshold=12', async () => {
    const res = await request(app).get('/reports/low-stock?threshold=12');
    expect(res.body.items.map((i) => i.sku)).toEqual(['D', 'E', 'A', 'F', 'B']);
  });
});
