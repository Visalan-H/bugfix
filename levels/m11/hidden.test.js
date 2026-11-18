const request = require('supertest');
const app = require('../src/app');

const put = (name, sizeKb, u = 'u1') => request(app).put(`/files/${name}`).set('x-user-id', u).send({ sizeKb });
const usage = async (u = 'u1') => (await request(app).get('/usage').set('x-user-id', u)).body.usedKb;

describe('hidden', () => {
  test('replacing a file adjusts by the difference', async () => {
    await put('doc.pdf', 300);
    await put('doc.pdf', 500);
    expect(await usage()).toBe(500);
  });
  test('exactly filling the quota is OK', async () => {
    await put('a', 1000);
    expect((await put('b', 24)).status).toBe(201);
  });
  test('replacing with a smaller file when full', async () => {
    await put('a', 1024);
    expect((await put('a', 10)).status).toBe(201);
    expect(await usage()).toBe(10);
  });
  test('users have separate quotas', async () => {
    await put('a', 1024, 'u1');
    expect((await put('a', 1024, 'u2')).status).toBe(201);
  });
  test('delete unknown → 404', async () => {
    expect((await request(app).delete('/files/nope').set('x-user-id', 'u1')).status).toBe(404);
  });
});
