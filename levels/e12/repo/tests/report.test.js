const request = require('supertest');
const app = require('../src/app');

const skus = (res) => res.body.items.map((i) => i.sku);

describe('Low stock', () => {
  test('threshold=10', async () => {
    const res = await request(app).get('/reports/low-stock?threshold=10');
    expect(skus(res)).toEqual(['D', 'E', 'A', 'F']);
    expect(res.body.totalUnits).toBe(22);
  });
  test('default threshold 5', async () => {
    const res = await request(app).get('/reports/low-stock');
    expect(skus(res)).toEqual(['D', 'E']);
    expect(res.body.totalUnits).toBe(3);
  });
  test('threshold=0 → only out of stock', async () => {
    const res = await request(app).get('/reports/low-stock?threshold=0');
    expect(skus(res)).toEqual(['D']);
  });
});
