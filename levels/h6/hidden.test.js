const request = require('supertest');
const app = require('../src/app');

const topup = (amount, key, w = 'w1') => { const r = request(app).post(`/wallets/${w}/topup`); if (key) r.set('Idempotency-Key', key); return r.send({ amount }); };
const pay = (amount, w = 'w1') => request(app).post(`/wallets/${w}/pay`).send({ amount });

describe('hidden', () => {
  test('cannot pay more than the balance', async () => {
    await topup(1000);
    expect((await pay(1001)).status).toBe(409);
    expect((await request(app).get('/wallets/w1')).body.balance).toBe(1000);
  });
  test('exact balance payment is fine', async () => {
    await topup(1000);
    expect((await pay(1000)).status).toBe(201);
  });
  test('different keys → separate credits', async () => {
    await topup(100, 'a'); await topup(100, 'b');
    expect((await request(app).get('/wallets/w1')).body.balance).toBe(200);
  });
  test('same key on another wallet is independent', async () => {
    await topup(100, 'k', 'w1');
    expect((await topup(100, 'k', 'w2')).status).toBe(201);
  });
  test('refund of an exact remaining amount is fine', async () => {
    await topup(1000);
    const p = await pay(600);
    await request(app).post(`/payments/${p.body._id}/refund`).send({ amount: 200 });
    expect((await request(app).post(`/payments/${p.body._id}/refund`).send({ amount: 400 })).status).toBe(201);
  });
});
