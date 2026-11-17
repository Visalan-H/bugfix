const request = require('supertest');
const app = require('../src/app');

const page = (n) => request(app).get(`/products?page=${n}`);

describe('Cache', () => {
  test('page 2 is page 2', async () => {
    await page(1);
    const res = await page(2);
    expect(res.body.items.map((i) => i.name)).toEqual(['Mat']);
  });
  test('second identical request is a hit', async () => {
    await page(1);
    await page(1);
    expect((await request(app).get('/cache/stats')).body).toEqual({ hits: 1, misses: 1 });
  });
  test('cached responses are identical', async () => {
    const a = await page(1);
    const b = await page(1);
    expect(b.body).toEqual(a.body);
    expect(b.body.items[0]).toEqual({ name: 'Mug', price: 100, priceWithGst: 118, _id: a.body.items[0]._id });
  });
});
