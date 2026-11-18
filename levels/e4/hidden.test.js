const request = require('supertest');
const app = require('../src/app');

const signup = (body) => request(app).post('/users').send(body);

describe('hidden', () => {
  test('duplicate check is case-insensitive', async () => {
    await signup({ email: 'Case@Example.com', password: 'pw-123456', name: 'A' });
    const res = await signup({ email: 'case@example.com', password: 'pw-123456', name: 'B' });
    expect(res.status).toBe(409);
  });

  test('stored email is normalised', async () => {
    const res = await signup({ email: '  Mixed@Example.COM ', password: 'pw-123456', name: 'M' });
    expect(res.body.email).toBe('mixed@example.com');
  });

  test('PATCH cannot overwrite passwordHash', async () => {
    const u = await signup({ email: 'x@example.com', password: 'pw-123456', name: 'X' });
    await request(app).patch('/users/me').set('x-user-id', u.body._id).send({ passwordHash: 'h$evil' });
    const stored = await require('../src/repositories/userRepo').findById(u.body._id);
    expect(stored.passwordHash).not.toBe('h$evil');
  });

  test('bio can be updated', async () => {
    const u = await signup({ email: 'b@example.com', password: 'pw-123456', name: 'B' });
    const res = await request(app).patch('/users/me').set('x-user-id', u.body._id).send({ bio: 'hi' });
    expect(res.body.bio).toBe('hi');
  });

  test('missing fields → 400', async () => {
    const res = await signup({ email: 'n@example.com' });
    expect(res.status).toBe(400);
  });

  test('GET /users/me without header → 401', async () => {
    const res = await request(app).get('/users/me');
    expect(res.status).toBe(401);
  });
});
