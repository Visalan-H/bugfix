const request = require('supertest');
const app = require('../src/app');
const outbox = require('../src/lib/outbox');

const post = (url, body) => request(app).post(url).send(body);

describe('hidden', () => {
  test('unknown email: still 202, nothing sent', async () => {
    const res = await post('/auth/forgot', { email: 'nobody@example.com' });
    expect(res.status).toBe(202);
    expect(outbox.sent).toHaveLength(0);
  });

  test('exactly 8 characters is accepted', async () => {
    await post('/auth/forgot', { email: 'asha@example.com' });
    const res = await post('/auth/reset', { token: outbox.sent[0].token, newPassword: '12345678' });
    expect(res.status).toBe(200);
  });

  test('7 characters is rejected', async () => {
    await post('/auth/forgot', { email: 'asha@example.com' });
    const res = await post('/auth/reset', { token: outbox.sent[0].token, newPassword: '1234567' });
    expect(res.status).toBe(400);
  });

  test('garbage token → 400', async () => {
    const res = await post('/auth/reset', { token: 'nope', newPassword: 'long-enough-pass' });
    expect(res.status).toBe(400);
  });

  test('padded email works for forgot and login', async () => {
    await post('/auth/forgot', { email: '  RAVI@example.com ' });
    expect(outbox.sent).toHaveLength(1);
    const res = await post('/auth/login', { email: ' Ravi@Example.com', password: 'ravi-secret' });
    expect(res.status).toBe(200);
  });
});
