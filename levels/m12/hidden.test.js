const request = require('supertest');
const app = require('../src/app');
const { sign } = require('../src/signature');

describe('hidden', () => {
  test('signature is case-insensitive', async () => {
    const sig = sign('{"order":1}').toUpperCase();
    expect((await request(app).post('/verify').send({ payload: '{"order":1}', signature: sig })).body.valid).toBe(true);
  });
  test('wrong signature is invalid', async () => {
    expect((await request(app).post('/verify').send({ payload: 'x', signature: 'deadbeef' })).body.valid).toBe(false);
  });
  test('4th failure still pending', async () => {
    const d = (await request(app).post('/deliveries')).body;
    let last;
    for (let i = 0; i < 4; i++) last = await request(app).post(`/deliveries/${d._id}/fail`);
    expect(last.body.status).toBe('pending');
  });
  test('unknown delivery → 404', async () => {
    expect((await request(app).post('/deliveries/nope/fail')).status).toBe(404);
  });
});
