const request = require('supertest');
const app = require('../src/app');

const search = (qs) => request(app).get(`/movies/search?${qs}`);
const titles = (res) => res.body.results.map((m) => m.title);

describe('GET /movies/search', () => {
  test('rule 1+2: director search, case-insensitive', async () => {
    const res = await search('q=nolan&field=director');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(4);
  });

  test('rule 1: partial title match ignores case', async () => {
    const res = await search('q=KNIGHT');
    expect(titles(res).sort()).toEqual(['Knight and Day', 'The Dark Knight']);
  });

  test('rule 4: rating desc, then title asc', async () => {
    const res = await search('q=sci-fi&field=genre');
    expect(titles(res)).toEqual(['Inception', 'Interstellar', 'Blade Runner 2049', 'Dune', 'Arrival']);
  });

  test('rule 3: whitespace-only q returns everything', async () => {
    const res = await search('q=%20%20%20');
    expect(res.body.count).toBe(10);
  });

  test('rule 5: minRating is inclusive', async () => {
    const res = await search('minRating=8.0');
    expect(titles(res)).toEqual(['The Dark Knight', 'Inception', 'Interstellar', 'Blade Runner 2049', 'Dune']);
  });
});
