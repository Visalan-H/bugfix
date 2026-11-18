const request = require('supertest');
const app = require('../src/app');

const ids = (res) => res.body.data.map((p) => p.id);

describe('hidden', () => {
  test('price_desc puts the most expensive first', async () => {
    const res = await request(app).get('/products?sort=price_desc&limit=2');
    expect(ids(res)).toEqual(['p1', 'p2']);
  });

  test('sorting does not change the default order for later requests', async () => {
    await request(app).get('/products?sort=price_asc');
    const res = await request(app).get('/products');
    expect(ids(res)).toEqual(['p1', 'p2', 'p3']);
  });

  test('category + sort + total', async () => {
    const res = await request(app).get('/products?category=books&sort=price_asc');
    expect(ids(res)).toEqual(['p3', 'p5']);
    expect(res.body.total).toBe(2);
  });

  test('last partial page', async () => {
    const res = await request(app).get('/products?page=2&limit=5');
    expect(ids(res)).toEqual(['p6', 'p7']);
  });

  test('page past the end is empty but total is still correct', async () => {
    const res = await request(app).get('/products?page=9');
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(7);
  });
});
