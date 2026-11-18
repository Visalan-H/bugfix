const request = require('supertest');
const app = require('../src/app');
const clock = require('../src/lib/clock');
const outbox = require('../src/lib/outbox');

const post = (url, body) => request(app).post(url).send(body);
const MIN = 60 * 1000;

describe('Password reset', () => {
  test('email lookup ignores case', async () => {
    const res = await post('/auth/forgot', { email: 'Asha@Example.com' });
    expect(res.status).toBe(202);
    expect(outbox.sent).toHaveLength(1);
    expect(outbox.sent[0].to).toBe('asha@example.com');
  });

  test('token still works 10 minutes later, and the new password logs in', async () => {
    await post('/auth/forgot', { email: 'asha@example.com' });
    const { token } = outbox.sent[0];
    clock.advance(10 * MIN);

    const res = await post('/auth/reset', { token, newPassword: 'brand-new-pass' });
    expect(res.status).toBe(200);
    expect((await post('/auth/login', { email: 'asha@example.com', password: 'brand-new-pass' })).status).toBe(200);
    expect((await post('/auth/login', { email: 'asha@example.com', password: 'old-password' })).status).toBe(401);
  });

  test('a token can only be used once', async () => {
    await post('/auth/forgot', { email: 'ravi@example.com' });
    const { token } = outbox.sent[0];
    expect((await post('/auth/reset', { token, newPassword: 'first-new-pass' })).status).toBe(200);
    const again = await post('/auth/reset', { token, newPassword: 'attacker-pass' });
    expect(again.status).toBe(400);
  });

  test('token expires after 15 minutes', async () => {
    await post('/auth/forgot', { email: 'asha@example.com' });
    const { token } = outbox.sent[0];
    clock.advance(16 * MIN);
    const res = await post('/auth/reset', { token, newPassword: 'too-late-pass' });
    expect(res.status).toBe(400);
  });
});
