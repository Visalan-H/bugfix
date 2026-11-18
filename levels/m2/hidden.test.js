const request = require('supertest');
const app = require('../src/app');

const as = (id, role = 'customer') => ({
  get: (u) => request(app).get(u).set('x-user-id', id).set('x-role', role),
  post: (u, b = {}) => request(app).post(u).set('x-user-id', id).set('x-role', role).send(b),
});
const cust = as('c1');
const stranger = as('c2');
const agent = as('a1', 'agent');

async function newTicket() {
  const r = await cust.post('/tickets', { title: 'Refund', description: '' });
  return r.body._id;
}

describe('hidden', () => {
  test('a stranger cannot close someone else\'s ticket (403)', async () => {
    const id = await newTicket();
    const res = await stranger.post(`/tickets/${id}/close`);
    expect(res.status).toBe(403);
  });

  test('an agent can close any ticket', async () => {
    const id = await newTicket();
    const res = await agent.post(`/tickets/${id}/close`);
    expect(res.status).toBe(200);
  });

  test('empty reply is 400', async () => {
    const id = await newTicket();
    const res = await cust.post(`/tickets/${id}/replies`, { body: '   ' });
    expect(res.status).toBe(400);
  });

  test('replies come back oldest first', async () => {
    const id = await newTicket();
    await cust.post(`/tickets/${id}/replies`, { body: 'one' });
    await agent.post(`/tickets/${id}/replies`, { body: 'two' });
    await cust.post(`/tickets/${id}/replies`, { body: 'three' });
    const t = await cust.get(`/tickets/${id}`);
    expect(t.body.replies.map((r) => r.body)).toEqual(['one', 'two', 'three']);
  });

  test('status filter', async () => {
    const a = await newTicket();
    await newTicket();
    await agent.post(`/tickets/${a}/close`);
    const res = await cust.get('/tickets?status=open');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].replyCount).toBe(0);
  });

  test('missing x-user-id is 401', async () => {
    const res = await request(app).get('/tickets');
    expect(res.status).toBe(401);
  });
});
