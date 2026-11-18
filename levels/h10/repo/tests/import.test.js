const request = require('supertest');
const app = require('../src/app');

const imp = (csv) => request(app).post('/import').send({ csv });

describe('CSV import', () => {
  test('quoted commas stay in one field', async () => {
    await imp('name,email,amount\n"Shah, Ankit",ankit@x.com,500');
    const c = (await request(app).get('/customers')).body[0];
    expect(c.name).toBe('Shah, Ankit');
    expect(c.amount).toBe(500);
  });
  test('thousands separators', async () => {
    await imp('name,email,amount\nMeena,meena@x.com,"1,200"');
    expect((await request(app).get('/customers')).body[0].amount).toBe(1200);
  });
  test('error line numbers match the file', async () => {
    const res = await imp('name,email,amount\nOk,ok@x.com,10\nBad,not-an-email,10');
    expect(res.body.errors).toEqual([{ line: 3, reason: 'name and a valid email are required' }]);
  });
});
