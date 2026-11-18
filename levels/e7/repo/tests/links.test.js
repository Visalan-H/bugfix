const request = require('supertest');
const app = require('../src/app');

const shorten = (url) => request(app).post('/links').send({ url });

describe('Shortener', () => {
  test('redirects with 302', async () => {
    const { body } = await shorten('https://amazon.jobs');
    const res = await request(app).get(`/${body.code}`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://amazon.jobs');
  });

  test('unknown code → 404', async () => {
    const res = await request(app).get('/nope99');
    expect(res.status).toBe(404);
  });

  test('visits are counted', async () => {
    const { body } = await shorten('https://example.com');
    await request(app).get(`/${body.code}`);
    await request(app).get(`/${body.code}`);
    const stats = await request(app).get(`/links/${body.code}/stats`);
    expect(stats.body.visits).toBe(2);
  });
});
