const request = require('supertest');
const app = require('../src/app');

const check = (name, userId) => request(app).get(`/flags/${name}?userId=${userId}`);
const users = Array.from({ length: 20 }, (_, i) => `user-${i + 1}`);

describe('Flags', () => {
  test("enabled: 'false' means off", async () => {
    expect((await check('new-checkout', 'alice')).body.enabled).toBe(false);
  });
  test('unknown flag is off, not an error', async () => {
    const res = await check('does-not-exist', 'alice');
    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(false);
  });
  test('0% rollout reaches nobody', async () => {
    for (const u of users) expect((await check('beta-search', u)).body.enabled).toBe(false);
  });
});
