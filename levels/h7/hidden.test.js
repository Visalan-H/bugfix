const request = require('supertest');
const app = require('../src/app');
const clock = require('../src/clock');

const enqueue = (type) => request(app).post('/jobs').send({ type });
const claim = (w) => request(app).post(`/workers/${w}/claim`);

describe('hidden', () => {
  test('expired lease → job can be reclaimed', async () => {
    await enqueue('x');
    await claim('w1');
    clock.advance(31 * 1000);
    const res = await claim('w2');
    expect(res.status).toBe(200);
    expect(res.body.worker).toBe('w2');
  });
  test('live lease → not reclaimable', async () => {
    await enqueue('x');
    await claim('w1');
    clock.advance(10 * 1000);
    expect((await claim('w2')).status).toBe(204);
  });
  test('old holder cannot complete after losing the lease', async () => {
    await enqueue('x');
    const job = (await claim('w1')).body;
    clock.advance(31 * 1000);
    await claim('w2');
    expect((await request(app).post(`/workers/w1/jobs/${job._id}/complete`)).status).toBe(409);
  });
  test('5 workers, 3 jobs → 3 distinct claims', async () => {
    await enqueue('a'); await enqueue('b'); await enqueue('c');
    const rs = await Promise.all([1, 2, 3, 4, 5].map((i) => claim(`w${i}`)));
    const ids = rs.filter((r) => r.status === 200).map((r) => r.body._id);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
  });
});
