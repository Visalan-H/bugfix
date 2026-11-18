const request = require('supertest');
const app = require('../src/app');

const put = (name, sizeKb) => request(app).put(`/files/${name}`).set('x-user-id', 'u1').send({ sizeKb });
const usage = async () => (await request(app).get('/usage').set('x-user-id', 'u1')).body.usedKb;

describe('Quota', () => {
  test('upload over quota → 413', async () => {
    await put('a.mp4', 1000);
    expect((await put('b.png', 100)).status).toBe(413);
    expect(await usage()).toBe(1000);
  });
  test('delete frees space', async () => {
    await put('a.mp4', 600);
    await request(app).delete('/files/a.mp4').set('x-user-id', 'u1');
    expect(await usage()).toBe(0);
  });
});
