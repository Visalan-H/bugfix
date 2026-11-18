const request = require('supertest');
const app = require('../src/app');

const quote = (body) => request(app).post('/shipping/quote').send(body);

describe('Shipping', () => {
  test('local, light parcel', async () => {
    expect((await quote({ weightKg: 0.5, zone: 'local', orderTotal: 100 })).body.fee).toBe(40);
  });
  test('national, 2.2 kg → 2 extra kg', async () => {
    expect((await quote({ weightKg: 2.2, zone: 'national', orderTotal: 100 })).body.fee).toBe(130);
  });
  test('exactly ₹499 ships free', async () => {
    expect((await quote({ weightKg: 1, zone: 'regional', orderTotal: 499 })).body.fee).toBe(0);
  });
});
