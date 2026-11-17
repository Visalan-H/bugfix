const request = require('supertest');
const app = require('../src/app');
const clock = require('../src/clock');

const vote = (poll, user, option) => request(app).post(`/polls/${poll}/vote`).set('x-user-id', user).send({ option });

describe('hidden', () => {
  test('unknown option → 400', async () => {
    expect((await vote('lunch', 'u1', 'pizza')).status).toBe(400);
  });
  test('closes exactly at closesAt', async () => {
    clock.set(Date.UTC(2026, 11, 1, 0, 0, 0));
    expect((await vote('lunch', 'u1', 'yes')).status).toBe(409);
  });
  test('no votes → zeros', async () => {
    expect((await request(app).get('/polls/lunch/results')).body).toEqual({
      total: 0, results: [{ option: 'yes', votes: 0, percent: 0 }, { option: 'no', votes: 0, percent: 0 }],
    });
  });
  test('unknown poll → 404', async () => {
    expect((await vote('nope', 'u1', 'yes')).status).toBe(404);
  });
});
