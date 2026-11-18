const request = require('supertest');
const app = require('../src/app');

const quote = (body) => request(app).post('/shipping/quote').send(body);

describe('hidden', () => {
  test('regional, exactly 1 kg', async () => {
    expect((await quote({ weightKg: 1, zone: 'regional', orderTotal: 10 })).body.fee).toBe(60);
  });
  test('exactly 2 kg → 1 extra kg', async () => {
    expect((await quote({ weightKg: 2, zone: 'local', orderTotal: 10 })).body.fee).toBe(60);
  });
  test('1.01 kg → 1 extra kg', async () => {
    expect((await quote({ weightKg: 1.01, zone: 'local', orderTotal: 10 })).body.fee).toBe(60);
  });
  test('unknown zone and bad weight → 400', async () => {
    expect((await quote({ weightKg: 1, zone: 'moon', orderTotal: 10 })).status).toBe(400);
    expect((await quote({ weightKg: 0, zone: 'local', orderTotal: 10 })).status).toBe(400);
  });
  test('₹498 still pays', async () => {
    expect((await quote({ weightKg: 1, zone: 'local', orderTotal: 498 })).body.fee).toBe(40);
  });
});
