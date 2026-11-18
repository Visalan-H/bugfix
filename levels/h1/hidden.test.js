const request = require('supertest');
const app = require('../src/app');

const search = (qs) => request(app).get(`/movies/search?${qs}`);
const titles = (res) => res.body.results.map((m) => m.title);

describe('hidden', () => {
  test('unknown field → 400', async () => {
    const res = await search('q=x&field=year');
    expect(res.status).toBe(400);
  });

  test('non-numeric minRating → 400', async () => {
    const res = await search('minRating=abc');
    expect(res.status).toBe(400);
  });

  test('minRating out of range → 400', async () => {
    const res = await search('minRating=11');
    expect(res.status).toBe(400);
  });

  test('regex special characters are treated literally', async () => {
    const res = await search('q=(500');
    expect(res.status).toBe(200);
    expect(titles(res)).toEqual(['(500) Days of Summer']);
  });

  test('padded q is trimmed before matching', async () => {
    const res = await search('q=%20dune%20');
    expect(titles(res)).toEqual(['Dune']);
  });

  test('genre + minRating combined, sorted', async () => {
    const res = await search('q=action&field=genre&minRating=6.9');
    expect(titles(res)).toEqual(['The Dark Knight', 'The Amazing Spider-Man']);
  });

  test('no match → empty list, count 0', async () => {
    const res = await search('q=zzz');
    expect(res.body).toEqual({ count: 0, results: [] });
  });
});
