const request = require('supertest');
const app = require('../src/app');

const topup = (amount, key) => { const r = request(app).post('/wallets/w1/topup'); if (key) r.set('Idempotency-Key', key); return r.send({ amount }); };
const pay = (amount) => request(app).post('/wallets/w1/pay').send({ amount });
const refund = (id, amount) => request(app).post(`/payments/${id}/refund`).send({ amount });
const bal = async () => (await request(app).get('/wallets/w1')).body.balance;

describe('Wallet', () => {
  test('payment reduces the balance', async () => {
    await topup(100000);
    await pay(30000);
    expect(await bal()).toBe(70000);
  });
  test('same Idempotency-Key credits once', async () => {
    const a = await topup(5000, 'k1');
    const b = await topup(5000, 'k1');
    expect(b.status).toBe(200);
    expect(b.body._id).toBe(a.body._id);
    expect(await bal()).toBe(5000);
  });
  test('refunds cannot exceed the payment', async () => {
    await topup(100000);
    const p = await pay(50000);
    expect((await refund(p.body._id, 30000)).status).toBe(201);
    expect((await refund(p.body._id, 30000)).status).toBe(400);
    expect(await bal()).toBe(80000);
  });
});
