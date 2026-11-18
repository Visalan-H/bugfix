const request = require('supertest');
const app = require('../src/app');

const names = (res) => res.body.map((u) => u.name);

describe('hidden', () => {
  test('uppercase query', async () => {
    expect(names(await request(app).get('/users/search?q=AN'))).toEqual(['Anand Kumar', 'Anitha R', 'Ankit Shah']);
  });
  test('padded query is trimmed', async () => {
    expect(names(await request(app).get('/users/search?q=%20an%20'))).toEqual(['Anand Kumar', 'Anitha R', 'Ankit Shah']);
  });
  test('no match → []', async () => {
    expect((await request(app).get('/users/search?q=zz')).body).toEqual([]);
  });
  test('limit=2', async () => {
    expect(names(await request(app).get('/users/search?limit=2'))).toEqual(['Anand Kumar', 'Anitha R']);
  });
});
