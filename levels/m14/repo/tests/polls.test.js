const request = require('supertest');
const app = require('../src/app');

const vote = (poll, user, option) => request(app).post(`/polls/${poll}/vote`).set('x-user-id', user).send({ option });
const results = (poll) => request(app).get(`/polls/${poll}/results`);

describe('Polls', () => {
  test('one vote per user', async () => {
    expect((await vote('lunch', 'u1', 'yes')).status).toBe(201);
    expect((await vote('lunch', 'u1', 'no')).status).toBe(409);
    expect((await results('lunch')).body.total).toBe(1);
  });
  test('percentages round to nearest', async () => {
    await vote('lunch', 'a', 'yes'); await vote('lunch', 'b', 'yes'); await vote('lunch', 'c', 'no');
    expect((await results('lunch')).body.results.map((r) => r.percent)).toEqual([67, 33]);
  });
  test('closed poll rejects votes', async () => {
    expect((await vote('old', 'u1', 'a')).status).toBe(409);
  });
});
