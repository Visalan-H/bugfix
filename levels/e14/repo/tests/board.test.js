const request = require('supertest');
const app = require('../src/app');

const submit = (player, score) => request(app).post('/scores').send({ player, score });
const board = (q = '') => request(app).get('/leaderboard' + q);

describe('Leaderboard', () => {
  test('a new player shows their score', async () => {
    await submit('ana', 50);
    expect((await board()).body).toEqual([{ rank: 1, player: 'ana', score: 50 }]);
  });
  test('ranks are 1-based and ties share a rank', async () => {
    await submit('a', 100); await submit('b', 90); await submit('c', 90); await submit('d', 80);
    expect((await board()).body.map((r) => r.rank)).toEqual([1, 2, 2, 4]);
  });
  test('top=2 returns the two best', async () => {
    await submit('low', 10); await submit('mid', 50); await submit('high', 99);
    expect((await board('?top=2')).body.map((r) => r.player)).toEqual(['high', 'mid']);
  });
});
