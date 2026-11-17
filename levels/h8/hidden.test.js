const request = require('supertest');
const app = require('../src/app');

describe('hidden', () => {
  test('page=0 → 400', async () => { expect((await request(app).get('/items?page=0')).status).toBe(400); });
  test('page=abc → 400', async () => { expect((await request(app).get('/items?page=abc')).status).toBe(400); });
  test('brand must match exactly (not prefix)', async () => {
    expect((await request(app).get('/items?brand=app')).body.total).toBe(0);
  });
  test('page 2 of a max-price filter', async () => {
    const res = await request(app).get('/items?maxPrice=13999&page=2&size=2');
    expect(res.body.items.map((i) => i.name)).toEqual(['Apple Pencil', 'Echo Dot']);
    expect(res.body.total).toBe(5);
  });
  test('brand + price', async () => {
    const res = await request(app).get('/items?brand=AMAZON&minPrice=5000');
    expect(res.body.items.map((i) => i.name)).toEqual(['Kindle']);
  });
});
