const request = require('supertest');
const app = require('../src/app');
const clock = require('../src/clock');

const hold = (user, seats) => request(app).post('/shows/s1/holds').set('x-user-id', user).send({ seats });
const status = async () => Object.fromEntries((await request(app).get('/shows/s1/seats')).body.map((s) => [s.seat, s.status]));

describe('Seat holds', () => {
  test('concurrent holds on the same seat: exactly one wins', async () => {
    const [a, b] = await Promise.all([hold('u1', ['A1']), hold('u2', ['A1'])]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
  });
  test('a failed hold changes nothing', async () => {
    await hold('u1', ['A3']);
    const res = await hold('u2', ['A2', 'A3']);
    expect(res.status).toBe(409);
    expect((await status()).A2).toBe('free');
  });
  test('expired holds are released', async () => {
    await hold('u1', ['A4']);
    clock.advance(6 * 60 * 1000);
    expect((await hold('u2', ['A4'])).status).toBe(201);
  });
});
