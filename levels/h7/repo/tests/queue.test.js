const request = require('supertest');
const app = require('../src/app');

const enqueue = (type) => request(app).post('/jobs').send({ type });
const claim = (w) => request(app).post(`/workers/${w}/claim`);

describe('Queue', () => {
  test('oldest job first', async () => {
    await enqueue('first'); await enqueue('second');
    expect((await claim('w1')).body.type).toBe('first');
  });
  test('concurrent claims never share a job', async () => {
    await enqueue('only');
    const [a, b] = await Promise.all([claim('w1'), claim('w2')]);
    expect([a.status, b.status].sort()).toEqual([200, 204]);
  });
  test('only the holder can complete', async () => {
    await enqueue('x');
    const job = (await claim('w1')).body;
    expect((await request(app).post(`/workers/w2/jobs/${job._id}/complete`)).status).toBe(409);
    expect((await request(app).post(`/workers/w1/jobs/${job._id}/complete`)).status).toBe(200);
  });
});
