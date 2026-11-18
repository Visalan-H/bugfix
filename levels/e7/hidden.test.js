const request = require('supertest');
const app = require('../src/app');

describe('hidden', () => {
  test('codes are 6 characters', async () => {
    const res = await request(app).post('/links').send({ url: 'https://a.b' });
    expect(res.body.code).toHaveLength(6);
  });
  test('invalid url → 400', async () => {
    expect((await request(app).post('/links').send({ url: 'ftp://x' })).status).toBe(400);
    expect((await request(app).post('/links').send({})).status).toBe(400);
  });
  test('stats for unknown code → 404', async () => {
    expect((await request(app).get('/links/zzzzzz/stats')).status).toBe(404);
  });
  test('a 404 does not create visits anywhere', async () => {
    const { body } = await request(app).post('/links').send({ url: 'https://x.y' });
    await request(app).get('/missing1');
    expect((await request(app).get(`/links/${body.code}/stats`)).body.visits).toBe(0);
  });
});
