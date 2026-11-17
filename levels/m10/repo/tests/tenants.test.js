const request = require('supertest');
const app = require('../src/app');

const as = (tenant, user, role = 'member') => ({
  get: (u) => request(app).get(u).set('x-tenant', tenant).set('x-user-id', user).set('x-role', role),
  del: (u) => request(app).delete(u).set('x-tenant', tenant).set('x-user-id', user).set('x-role', role),
});

describe('Tenants', () => {
  test('search stays inside the tenant', async () => {
    const res = await as('acme', 'u1').get('/projects/search?q=ap');
    expect(res.body.map((p) => p.name)).toEqual(['Apollo']);
  });
  test('a member cannot delete someone else\'s project', async () => {
    expect((await as('acme', 'u2').del('/projects/p1')).status).toBe(403);
  });
  test('an admin cannot delete another tenant\'s project', async () => {
    expect((await as('globex', 'g1', 'admin').del('/projects/p1')).status).toBe(404);
    expect((await as('acme', 'u1').get('/projects')).body).toHaveLength(2);
  });
});
