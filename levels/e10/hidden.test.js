const request = require('supertest');
const app = require('../src/app');

const check = (name, userId) => request(app).get(`/flags/${name}?userId=${userId}`);

describe('hidden', () => {
  test('100% rollout reaches everyone', async () => {
    for (let i = 1; i <= 20; i++) expect((await check('everyone', `user-${i}`)).body.enabled).toBe(true);
  });
  test('50% rollout uses non-negative buckets', async () => {
    expect((await check('dark-mode', 'user-1')).body.enabled).toBe(false);
    expect((await check('dark-mode', 'user-10')).body.enabled).toBe(true);
    expect((await check('dark-mode', 'alice')).body.enabled).toBe(true);
    expect((await check('dark-mode', 'dave')).body.enabled).toBe(false);
  });
  test('same user → same answer', async () => {
    const a = (await check('dark-mode', 'erin')).body.enabled;
    const b = (await check('dark-mode', 'erin')).body.enabled;
    expect(a).toBe(b);
  });
});
