const request = require('supertest');
const app = require('../src/app');
const clock = require('../src/lib/clock');

const as = (m) => ({
  borrow: (bookId) => request(app).post('/loans').set('x-member-id', m).send({ bookId }),
  ret: (id) => request(app).post(`/loans/${id}/return`).set('x-member-id', m),
  book: (id) => request(app).get(`/books/${id}`).set('x-member-id', m),
});
const priya = as('priya');

describe('Loans', () => {
  test('2 days late → ₹20 fee', async () => {
    const loan = await priya.borrow('b-sapiens');
    clock.advanceDays(16);
    const res = await priya.ret(loan.body._id);
    expect(res.status).toBe(200);
    expect(res.body.fee).toBe(20);
  });

  test('returning early → fee 0', async () => {
    const loan = await priya.borrow('b-sapiens');
    clock.advanceDays(3);
    const res = await priya.ret(loan.body._id);
    expect(res.body.fee).toBe(0);
  });

  test('returned loans don\'t count toward the 3-loan limit', async () => {
    const first = await priya.borrow('b-sapiens');
    await priya.borrow('b-sapiens');
    await priya.borrow('b-ddia');
    await priya.ret(first.body._id);
    const res = await priya.borrow('b-ddia');
    expect(res.status).toBe(201);
  });

  test('a loan can only be returned once', async () => {
    const loan = await priya.borrow('b-ddia');
    await priya.ret(loan.body._id);
    const again = await priya.ret(loan.body._id);
    expect(again.status).toBe(409);
    expect((await priya.book('b-ddia')).body.available).toBe(4);
  });
});
