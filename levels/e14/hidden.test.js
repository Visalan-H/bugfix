const request = require('supertest');
const app = require('../src/app');

const submit = (player, score) => request(app).post('/scores').send({ player, score });

describe('hidden', () => {
  test('a lower score does not replace the best', async () => {
    await submit('x', 70); await submit('x', 20);
    expect((await request(app).get('/leaderboard')).body[0].score).toBe(70);
  });
  test('a higher score replaces it', async () => {
    await submit('x', 70); await submit('x', 85);
    expect((await request(app).get('/leaderboard')).body[0].score).toBe(85);
  });
  test('score 0 is valid', async () => {
    expect((await submit('z', 0)).status).toBe(201);
    expect((await request(app).get('/leaderboard')).body[0]).toEqual({ rank: 1, player: 'z', score: 0 });
  });
  test('bad scores → 400', async () => {
    expect((await submit('q', -1)).status).toBe(400);
    expect((await submit('q', '5')).status).toBe(400);
  });
});
