const request = require('supertest');
const app = require('../src/app');

const book = (doctorId, start, end) => request(app).post('/appointments').send({ doctorId, start, end });

describe('hidden', () => {
  test('end before start → 400', async () => { expect((await book('iyer', 700, 650)).status).toBe(400); });
  test('zero-length → 400', async () => { expect((await book('iyer', 700, 700)).status).toBe(400); });
  test('fully inside an existing slot → 409', async () => {
    await book('iyer', 600, 720);
    expect((await book('iyer', 630, 660)).status).toBe(409);
  });
  test('ending exactly when another starts is fine', async () => {
    await book('iyer', 630, 660);
    expect((await book('iyer', 600, 630)).status).toBe(201);
  });
  test('cancel unknown → 404', async () => {
    expect((await request(app).post('/appointments/nope/cancel')).status).toBe(404);
  });
});
