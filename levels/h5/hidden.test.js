const request = require('supertest');
const app = require('../src/app');
const clock = require('../src/clock');

const hold = (user, seats) => request(app).post('/shows/s1/holds').set('x-user-id', user).send({ seats });
const confirm = (id) => request(app).post(`/holds/${id}/confirm`);

describe('hidden', () => {
  test('confirm within 5 minutes books the seats', async () => {
    const h = await hold('u1', ['A1', 'A2']);
    clock.advance(4 * 60 * 1000);
    expect((await confirm(h.body.holdId)).status).toBe(200);
    expect((await hold('u2', ['A1'])).status).toBe(409);
  });
  test('confirm after expiry → 410', async () => {
    const h = await hold('u1', ['A5']);
    clock.advance(6 * 60 * 1000);
    expect((await confirm(h.body.holdId)).status).toBe(410);
  });
  test('stale confirm cannot steal a re-held seat', async () => {
    const h1 = await hold('u1', ['A5']);
    clock.advance(6 * 60 * 1000);
    const h2 = await hold('u2', ['A5']);
    expect(h2.status).toBe(201);
    await confirm(h1.body.holdId);
    expect((await confirm(h2.body.holdId)).status).toBe(200);
  });
  test('5 concurrent holds on overlapping seats never double-hold', async () => {
    const reqs = [['A1', 'A2'], ['A2', 'A3'], ['A3', 'A4'], ['A4', 'A5'], ['A5', 'A1']];
    const rs = await Promise.all(reqs.map((s, i) => hold(`u${i}`, s)));
    const won = rs.map((r, i) => (r.status === 201 ? reqs[i] : [])).flat();
    expect(new Set(won).size).toBe(won.length);
  });
});
