const request = require('supertest');
const app = require('../src/app');

const post = (body) => request(app).post('/profiles').send(body);
const ok = { name: 'Kavin', age: 30, email: 'kavin@example.com' };

describe('Profile validation', () => {
  test('age 0 is valid', async () => {
    expect((await post({ ...ok, age: 0 })).status).toBe(201);
  });
  test('tags array is accepted', async () => {
    expect((await post({ ...ok, tags: ['family', 'admin'] })).status).toBe(201);
  });
  test('email must be the whole value', async () => {
    expect((await post({ ...ok, email: 'hello a@b.co' })).status).toBe(400);
  });
});
