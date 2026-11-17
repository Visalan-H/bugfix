const request = require('supertest');
const app = require('../src/app');
const clock = require('../src/clock');

describe('hidden', () => {
  test('new product appears immediately', async () => {
    await request(app).get('/products?page=2');
    await request(app).post('/products').send({ name: 'Pen', price: 20 });
    const res = await request(app).get('/products?page=2');
    expect(res.body.items.map((i) => i.name)).toEqual(['Mat', 'Pen']);
  });
  test('expires after 30s', async () => {
    await request(app).get('/products?page=1');
    clock.advance(31 * 1000);
    await request(app).get('/products?page=1');
    expect((await request(app).get('/cache/stats')).body).toEqual({ hits: 0, misses: 2 });
  });
  test('still cached at 29s', async () => {
    await request(app).get('/products?page=1');
    clock.advance(29 * 1000);
    await request(app).get('/products?page=1');
    expect((await request(app).get('/cache/stats')).body.hits).toBe(1);
  });
});
