const request = require('supertest');
const app = require('../src/app');

const as = (tenant, user, role = 'member') => ({
  get: (u) => request(app).get(u).set('x-tenant', tenant).set('x-user-id', user).set('x-role', role),
  del: (u) => request(app).delete(u).set('x-tenant', tenant).set('x-user-id', user).set('x-role', role),
});

describe('hidden', () => {
  test('owner can delete their own project', async () => {
    expect((await as('acme', 'u1').del('/projects/p1')).status).toBe(204);
  });
  test('tenant admin can delete any project in the tenant', async () => {
    expect((await as('acme', 'boss', 'admin').del('/projects/p2')).status).toBe(204);
  });
  test('globex search for "a" sees only Apex', async () => {
    expect((await as('globex', 'g1').get('/projects/search?q=A')).body.map((p) => p.name)).toEqual(['Apex']);
  });
  test('no tenant → 401', async () => {
    expect((await request(app).get('/projects')).status).toBe(401);
  });
});
