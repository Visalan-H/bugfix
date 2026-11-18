const request = require('supertest');
const app = require('../src/app');

const names = (res) => res.body.items.map((i) => i.name);

describe('Item search', () => {
  test('price range uses both bounds', async () => {
    const res = await request(app).get('/items?minPrice=9999&maxPrice=13999&size=10');
    expect(names(res)).toEqual(['AirPods', 'Galaxy Buds', 'Kindle']);
  });
  test('total counts all matches', async () => {
    const res = await request(app).get('/items?size=2');
    expect(res.body.items).toHaveLength(2);
    expect(res.body.total).toBe(8);
  });
  test('brand is case-insensitive', async () => {
    const res = await request(app).get('/items?brand=apple');
    expect(names(res)).toEqual(['iPhone 15', 'AirPods', 'Apple Pencil']);
  });
});
