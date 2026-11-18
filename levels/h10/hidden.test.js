const request = require('supertest');
const app = require('../src/app');

const imp = (csv) => request(app).post('/import').send({ csv });

describe('hidden', () => {
  test('blank lines ignored, trailing newline ok', async () => {
    const res = await imp('name,email,amount\nA,a@x.com,1\n\nB,b@x.com,2\n');
    expect(res.body).toEqual({ imported: 2, skipped: 0, errors: [] });
  });
  test('duplicate emails are skipped (case-insensitive)', async () => {
    const res = await imp('name,email,amount\nA,a@x.com,1\nA2,A@X.com,2');
    expect(res.body).toMatchObject({ imported: 1, skipped: 1 });
  });
  test('escaped quotes', async () => {
    await imp('name,email,amount\n"The ""Boss""",boss@x.com,1');
    expect((await request(app).get('/customers')).body[0].name).toBe('The "Boss"');
  });
  test('"12abc" is not a number', async () => {
    const res = await imp('name,email,amount\nA,a@x.com,12abc');
    expect(res.body.errors).toEqual([{ line: 2, reason: 'amount is not a number' }]);
  });
});
