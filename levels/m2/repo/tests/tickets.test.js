const request = require('supertest');
const app = require('../src/app');

const as = (id, role = 'customer') => ({
  get: (u) => request(app).get(u).set('x-user-id', id).set('x-role', role),
  post: (u, b = {}) => request(app).post(u).set('x-user-id', id).set('x-role', role).send(b),
});
const cust = as('c1');
const agent = as('a1', 'agent');

async function newTicket() {
  const r = await cust.post('/tickets', { title: 'Order not delivered', description: 'Order #123' });
  return r.body._id;
}

describe('Support desk', () => {
  test('unknown ticket is 404', async () => {
    const res = await cust.get('/tickets/does-not-exist');
    expect(res.status).toBe(404);
  });

  test('customer can reply to a ticket', async () => {
    const id = await newTicket();
    const res = await cust.post(`/tickets/${id}/replies`, { body: 'Any update?' });
    expect(res.status).toBe(201);
    const t = await cust.get(`/tickets/${id}`);
    expect(t.body.replies).toHaveLength(1);
    expect(t.body.replies[0].body).toBe('Any update?');
  });

  test('author can close their own ticket', async () => {
    const id = await newTicket();
    const res = await cust.post(`/tickets/${id}/close`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('closed');
  });

  test('replying to a closed ticket is 409', async () => {
    const id = await newTicket();
    await agent.post(`/tickets/${id}/close`);
    const res = await cust.post(`/tickets/${id}/replies`, { body: 'hello?' });
    expect(res.status).toBe(409);
  });

  test('GET /tickets includes replyCount', async () => {
    const id = await newTicket();
    await agent.post(`/tickets/${id}/replies`, { body: 'Looking into it' });
    const res = await cust.get('/tickets');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Order not delivered');
    expect(res.body[0].replyCount).toBe(1);
  });
});
