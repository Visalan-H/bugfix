const request = require('supertest');
const app = require('../src/app');

const signup = (body) => request(app).post('/users').send(body);

describe('Users', () => {
  test('signup works and returns 201', async () => {
    const res = await signup({ email: 'meera@example.com', password: 'pw-123456', name: 'Meera' });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('meera@example.com');
    expect(res.body.role).toBe('user');
  });

  test('signup response never includes passwordHash', async () => {
    const res = await signup({ email: 'arun@example.com', password: 'pw-123456', name: 'Arun' });
    expect(res.body._id).toBeDefined();
    expect(res.body.passwordHash).toBeUndefined();
  });

  test('duplicate email → 409', async () => {
    await signup({ email: 'dup@example.com', password: 'pw-123456', name: 'One' });
    const res = await signup({ email: 'dup@example.com', password: 'pw-654321', name: 'Two' });
    expect(res.status).toBe(409);
  });

  test('PATCH /users/me cannot change role', async () => {
    const u = await signup({ email: 'eve@example.com', password: 'pw-123456', name: 'Eve' });
    const res = await request(app).patch('/users/me').set('x-user-id', u.body._id).send({ name: 'Eve 2', role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Eve 2');
    expect(res.body.role).toBe('user');
  });
});
