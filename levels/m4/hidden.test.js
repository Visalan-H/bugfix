const request = require('supertest');
const app = require('../src/app');
const clock = require('../src/lib/clock');

const as = (m) => ({
  borrow: (bookId) => request(app).post('/loans').set('x-member-id', m).send({ bookId }),
  ret: (id) => request(app).post(`/loans/${id}/return`).set('x-member-id', m),
  book: (id) => request(app).get(`/books/${id}`).set('x-member-id', m),
});

describe('hidden', () => {
  test('cannot borrow the last copy twice', async () => {
    expect((await as('a').borrow('b-ponniyin')).status).toBe(201);
    const res = await as('b').borrow('b-ponniyin');
    expect(res.status).toBe(409);
    expect((await as('b').book('b-ponniyin')).body.available).toBe(0);
  });

  test('one hour late = one day fee', async () => {
    const loan = await as('a').borrow('b-sapiens');
    clock.advanceDays(14);
    clock.advance(60 * 60 * 1000);
    const res = await as('a').ret(loan.body._id);
    expect(res.body.fee).toBe(10);
  });

  test('returning exactly on the due moment → 0', async () => {
    const loan = await as('a').borrow('b-sapiens');
    clock.advanceDays(14);
    const res = await as('a').ret(loan.body._id);
    expect(res.body.fee).toBe(0);
  });

  test('4th active loan → 409', async () => {
    const a = as('a');
    await a.borrow('b-sapiens'); await a.borrow('b-sapiens'); await a.borrow('b-ddia');
    const res = await a.borrow('b-ddia');
    expect(res.status).toBe(409);
  });

  test('cannot return someone else\'s loan', async () => {
    const loan = await as('a').borrow('b-sapiens');
    const res = await as('b').ret(loan.body._id);
    expect(res.status).toBe(403);
  });
});
