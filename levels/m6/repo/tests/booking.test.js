const request = require('supertest');
const app = require('../src/app');

const book = (doctorId, start, end) => request(app).post('/appointments').send({ doctorId, start, end });

describe('Booking', () => {
  test('back-to-back slots are fine', async () => {
    expect((await book('iyer', 600, 630)).status).toBe(201);
    expect((await book('iyer', 630, 660)).status).toBe(201);
  });
  test('real overlap → 409', async () => {
    await book('iyer', 600, 660);
    expect((await book('iyer', 630, 690)).status).toBe(409);
  });
  test('different doctors don\'t clash', async () => {
    await book('iyer', 600, 630);
    expect((await book('rao', 600, 630)).status).toBe(201);
  });
  test('cancelled slot can be rebooked', async () => {
    const a = await book('iyer', 600, 630);
    await request(app).post(`/appointments/${a.body._id}/cancel`);
    expect((await book('iyer', 600, 630)).status).toBe(201);
  });
});
