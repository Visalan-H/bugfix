const request = require('supertest');
const app = require('../src/app');

const ids = (res) => res.body.data.map((p) => p.id);

describe('GET /products', () => {
  test('defaults to page 1 with 3 items', async () => {
    const res = await request(app).get('/products');
    expect(res.status).toBe(200);
    expect(ids(res)).toEqual(['p1', 'p2', 'p3']);
    expect(res.body.total).toBe(7);
  });

  test('page=2&limit=2 returns the 3rd and 4th products', async () => {
    const res = await request(app).get('/products?page=2&limit=2');
    expect(ids(res)).toEqual(['p3', 'p4']);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(2);
  });

  test('sort=price_asc puts the cheapest first', async () => {
    const res = await request(app).get('/products?sort=price_asc&limit=4');
    expect(ids(res)).toEqual(['p3', 'p6', 'p7', 'p5']);
  });
});
