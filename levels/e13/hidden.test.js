const request = require('supertest');
const app = require('../src/app');

const post = (body) => request(app).post('/profiles').send(body);
const ok = { name: 'Kavin', age: 30, email: 'kavin@example.com' };

describe('hidden', () => {
  test('25.5 is not an integer', async () => { expect((await post({ ...ok, age: 25.5 })).status).toBe(400); });
  test('6 tags → 400', async () => { expect((await post({ ...ok, tags: ['a', 'b', 'c', 'd', 'e', 'f'] })).status).toBe(400); });
  test('non-string tag → 400', async () => { expect((await post({ ...ok, tags: ['a', 5] })).status).toBe(400); });
  test('tags as a string → 400', async () => { expect((await post({ ...ok, tags: 'abc' })).status).toBe(400); });
  test('blank name → 400', async () => { expect((await post({ ...ok, name: '   ' })).status).toBe(400); });
  test('age 121 → 400, 120 ok', async () => {
    expect((await post({ ...ok, age: 121 })).status).toBe(400);
    expect((await post({ ...ok, age: 120 })).status).toBe(201);
  });
});
