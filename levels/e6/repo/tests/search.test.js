const request = require('supertest');
const app = require('../src/app');

const names = (res) => res.body.map((u) => u.name);

describe('Directory search', () => {
  test('prefix match, case-insensitive, sorted', async () => {
    const res = await request(app).get('/users/search?q=an');
    expect(names(res)).toEqual(['Anand Kumar', 'Anitha R', 'Ankit Shah']);
  });

  test('no q returns the first 5 alphabetically', async () => {
    const res = await request(app).get('/users/search');
    expect(res.status).toBe(200);
    expect(names(res)).toEqual(['Anand Kumar', 'Anitha R', 'Ankit Shah', 'Arjun P', 'Bhavana S']);
  });

  test('limit is capped, not an error', async () => {
    const res = await request(app).get('/users/search?limit=50');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(8);
  });
});
